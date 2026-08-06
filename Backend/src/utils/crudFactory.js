/**
 * Generic CRUD factory.
 * Pass a Mongoose model + config and get a full controller + router back.
 *
 * Usage:
 *   import { makeCrudController } from '../utils/crudFactory.js';
 *   import Zone from '../models/Zone.js';
 *   export const zoneController = makeCrudController(Zone, ['code','name','description']);
 */
import { buildQuery } from './queryHelper.js';

export function makeCrudController(Model, searchFields = ['code', 'name']) {
  return {
    /** GET /api/<resource>?page=1&limit=10&search=&sort= */
    getAll: async (req, res, next) => {
      try {
        const result = await buildQuery(Model, req.query, searchFields);
        res.status(200).json({ success: true, ...result });
      } catch (e) { next(e); }
    },

    /** GET /api/<resource>/lookup  — lightweight list for dropdowns */
    lookup: async (req, res, next) => {
      try {
        const filter = { status: 'Active' };
        const items = await Model.find(filter)
          .select('_id code name symbol unit days rate transitDays')
          .sort({ name: 1 })
          .lean();
        res.status(200).json({ success: true, data: items });
      } catch (e) { next(e); }
    },

    /** GET /api/<resource>/:id */
    getOne: async (req, res, next) => {
      try {
        const doc = await Model.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ success: false, error: `${Model.modelName} not found` });
        res.status(200).json({ success: true, data: doc });
      } catch (e) { next(e); }
    },

    /** POST /api/<resource> */
    create: async (req, res, next) => {
      try {
        // Duplicate code check (if model has code field)
        if (req.body.code) {
          const exists = await Model.findOne({ code: req.body.code.trim().toUpperCase() });
          if (exists) return res.status(400).json({ success: false, error: `${Model.modelName} code '${req.body.code}' already exists` });
        }
        const doc = await Model.create({ ...req.body, createdBy: req.user?._id });
        res.status(201).json({ success: true, message: `${Model.modelName} created`, data: doc });
      } catch (e) { next(e); }
    },

    /** PUT /api/<resource>/:id */
    update: async (req, res, next) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: `${Model.modelName} not found` });
        const updated = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, message: `${Model.modelName} updated`, data: updated });
      } catch (e) { next(e); }
    },

    /** DELETE /api/<resource>/:id */
    remove: async (req, res, next) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: `${Model.modelName} not found` });
        await doc.deleteOne();
        res.status(200).json({ success: true, message: `${Model.modelName} deleted` });
      } catch (e) { next(e); }
    },

    /** PUT /api/<resource>/:id/toggle-status */
    toggleStatus: async (req, res, next) => {
      try {
        const doc = await Model.findById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: `${Model.modelName} not found` });
        doc.status = doc.status === 'Active' ? 'Inactive' : 'Active';
        await doc.save();
        res.status(200).json({ success: true, message: `Status changed to ${doc.status}`, data: doc });
      } catch (e) { next(e); }
    },
  };
}

/**
 * makeCrudRouter — returns a fully wired Express router for a controller.
 * lookup route MUST come before /:id to avoid being swallowed as an ID param.
 */
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';

export function makeCrudRouter(controller, writeRoles = ['Super Admin', 'Administrator']) {
  const router = express.Router();
  router.use(protect);

  router.get('/lookup', controller.lookup);
  router.get('/', controller.getAll);
  router.post('/', authorize(...writeRoles), controller.create);
  router.get('/:id', controller.getOne);
  router.put('/:id', authorize(...writeRoles), controller.update);
  router.delete('/:id', authorize(...writeRoles), controller.remove);
  router.put('/:id/toggle-status', authorize(...writeRoles), controller.toggleStatus);

  return router;
}
