import Incoterm from '../models/Incoterm.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['code', 'name', 'description'];

/* ── GET /api/master/incoterms  (paginated, admin table) ─────────────────── */
export const getAllIncoterms = async (req, res, next) => {
  try {
    const result = await buildQuery(Incoterm, req.query, SEARCH_FIELDS);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

/* ── GET /api/master/incoterms/lookup  (dropdown — isActive only) ────────── */
export const lookupIncoterms = async (req, res, next) => {
  try {
    const items = await Incoterm.find({ isActive: true })
      .select('_id code name description sortOrder')
      .sort({ sortOrder: 1, code: 1 })
      .lean();
    res.status(200).json({ success: true, data: items });
  } catch (e) { next(e); }
};

/* ── GET /api/master/incoterms/:id ───────────────────────────────────────── */
export const getIncotermById = async (req, res, next) => {
  try {
    const doc = await Incoterm.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Incoterm not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

/* ── POST /api/master/incoterms ──────────────────────────────────────────── */
export const createIncoterm = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
    const exists = await Incoterm.findOne({ code: code.trim().toUpperCase() });
    if (exists) return res.status(400).json({ success: false, error: `Incoterm code '${code}' already exists` });
    const doc = await Incoterm.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, message: 'Incoterm created', data: doc });
  } catch (e) { next(e); }
};

/* ── PUT /api/master/incoterms/:id ───────────────────────────────────────── */
export const updateIncoterm = async (req, res, next) => {
  try {
    const doc = await Incoterm.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Incoterm not found' });
    const updated = await Incoterm.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?._id },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Incoterm updated', data: updated });
  } catch (e) { next(e); }
};

/* ── DELETE /api/master/incoterms/:id ────────────────────────────────────── */
export const deleteIncoterm = async (req, res, next) => {
  try {
    const doc = await Incoterm.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Incoterm not found' });
    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Incoterm deleted' });
  } catch (e) { next(e); }
};

/* ── PUT /api/master/incoterms/:id/toggle-status ─────────────────────────── */
export const toggleIncotermStatus = async (req, res, next) => {
  try {
    const doc = await Incoterm.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Incoterm not found' });
    doc.isActive = !doc.isActive;
    await doc.save();
    res.status(200).json({
      success: true,
      message: `Incoterm ${doc.isActive ? 'activated' : 'deactivated'}`,
      data: doc,
    });
  } catch (e) { next(e); }
};
