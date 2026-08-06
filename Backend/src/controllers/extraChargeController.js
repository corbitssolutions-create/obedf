import ExtraCharge from '../models/ExtraCharge.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['chargeCode', 'chargeName', 'description'];

/* ── GET /api/master/extra-charges ───────────────────────────────────────── */
export const getAllExtraCharges = async (req, res, next) => {
  try {
    const result = await buildQuery(ExtraCharge, req.query, SEARCH_FIELDS);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

/* ── GET /api/master/extra-charges/lookup — active only, for dropdowns ───── */
export const lookupExtraCharges = async (req, res, next) => {
  try {
    const items = await ExtraCharge.find({ isActive: true })
      .select('_id chargeCode chargeName chargeType defaultAmount sortOrder isDefault')
      .sort({ sortOrder: 1, chargeName: 1 })
      .lean();
    res.status(200).json({ success: true, data: items });
  } catch (e) { next(e); }
};

/* ── GET /api/master/extra-charges/defaults ─────────────────────────────── */
/**
 * Returns all charges where isActive=true AND isDefault=true.
 * Called when a new Waybill is initialised to auto-populate charges.
 */
export const getDefaultExtraCharges = async (req, res, next) => {
  try {
    const items = await ExtraCharge.find({ isActive: true, isDefault: true })
      .select('_id chargeCode chargeName chargeType defaultAmount sortOrder description')
      .sort({ sortOrder: 1, chargeName: 1 })
      .lean();
    res.status(200).json({ success: true, data: items });
  } catch (e) { next(e); }
};

/* ── GET /api/master/extra-charges/:id ───────────────────────────────────── */
export const getExtraChargeById = async (req, res, next) => {
  try {
    const doc = await ExtraCharge.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Extra charge not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

/* ── POST /api/master/extra-charges ─────────────────────────────────────── */
export const createExtraCharge = async (req, res, next) => {
  try {
    const { chargeCode } = req.body;
    if (!chargeCode) return res.status(400).json({ success: false, error: 'chargeCode is required' });
    const exists = await ExtraCharge.findOne({ chargeCode: chargeCode.trim().toUpperCase() });
    if (exists) return res.status(400).json({ success: false, error: `Charge code '${chargeCode}' already exists` });
    const doc = await ExtraCharge.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, message: 'Extra charge created', data: doc });
  } catch (e) { next(e); }
};

/* ── PUT /api/master/extra-charges/:id ───────────────────────────────────── */
export const updateExtraCharge = async (req, res, next) => {
  try {
    const doc = await ExtraCharge.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Extra charge not found' });
    const updated = await ExtraCharge.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?._id },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Extra charge updated', data: updated });
  } catch (e) { next(e); }
};

/* ── DELETE /api/master/extra-charges/:id ────────────────────────────────── */
export const deleteExtraCharge = async (req, res, next) => {
  try {
    const doc = await ExtraCharge.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Extra charge not found' });
    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Extra charge deleted' });
  } catch (e) { next(e); }
};

/* ── PUT /api/master/extra-charges/:id/toggle-status ────────────────────── */
export const toggleExtraChargeStatus = async (req, res, next) => {
  try {
    const doc = await ExtraCharge.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Extra charge not found' });
    doc.isActive = !doc.isActive;
    doc.status   = doc.isActive ? 'Active' : 'Inactive';
    await doc.save();
    res.status(200).json({ success: true, message: `Extra charge ${doc.isActive ? 'activated' : 'deactivated'}`, data: doc });
  } catch (e) { next(e); }
};

/* ── PUT /api/master/extra-charges/:id/toggle-default ───────────────────── */
export const toggleExtraChargeDefault = async (req, res, next) => {
  try {
    const doc = await ExtraCharge.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Extra charge not found' });
    doc.isDefault = !doc.isDefault;
    await doc.save();
    res.status(200).json({ success: true, message: `Default ${doc.isDefault ? 'enabled' : 'disabled'}`, data: doc });
  } catch (e) { next(e); }
};
