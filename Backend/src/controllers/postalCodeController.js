import PostalCode from '../models/PostalCode.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH_FIELDS = ['code', 'suburb', 'city', 'province'];
const POPULATE = [{ path: 'branchCode', select: '_id code name' }];

/* ── GET /api/master/postal-codes ────────────────────────────────────────── */
export const getAllPostalCodes = async (req, res, next) => {
  try {
    const result = await buildQuery(PostalCode, req.query, SEARCH_FIELDS, {}, POPULATE);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

/* ── GET /api/master/postal-codes/:id ────────────────────────────────────── */
export const getPostalCodeById = async (req, res, next) => {
  try {
    const doc = await PostalCode.findById(req.params.id).populate(POPULATE).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Postal code not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

/* ── POST /api/master/postal-codes ───────────────────────────────────────── */
export const createPostalCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Postal code is required' });
    const exists = await PostalCode.findOne({ code: code.trim() });
    if (exists) return res.status(400).json({ success: false, error: `Postal code '${code}' already exists` });
    const doc = await PostalCode.create({ ...req.body, createdBy: req.user?._id });
    const populated = await PostalCode.findById(doc._id).populate(POPULATE).lean();
    res.status(201).json({ success: true, message: 'Postal code created', data: populated });
  } catch (e) { next(e); }
};

/* ── PUT /api/master/postal-codes/:id ────────────────────────────────────── */
export const updatePostalCode = async (req, res, next) => {
  try {
    const doc = await PostalCode.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Postal code not found' });
    const updated = await PostalCode.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    ).populate(POPULATE).lean();
    res.status(200).json({ success: true, message: 'Postal code updated', data: updated });
  } catch (e) { next(e); }
};

/* ── DELETE /api/master/postal-codes/:id ─────────────────────────────────── */
export const deletePostalCode = async (req, res, next) => {
  try {
    const doc = await PostalCode.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Postal code not found' });
    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Postal code deleted' });
  } catch (e) { next(e); }
};

/* ── PUT /api/master/postal-codes/:id/toggle-status ─────────────────────── */
export const togglePostalCodeStatus = async (req, res, next) => {
  try {
    const doc = await PostalCode.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Postal code not found' });
    doc.status = doc.status === 'Active' ? 'Inactive' : 'Active';
    await doc.save();
    const populated = await PostalCode.findById(doc._id).populate(POPULATE).lean();
    res.status(200).json({ success: true, message: `Status changed to ${doc.status}`, data: populated });
  } catch (e) { next(e); }
};

/**
 * @desc  Lookup postal code → return branch assignment + display fields.
 *        Called by Waybill form to auto-determine the TO Branch.
 * @route GET /api/master/postal-codes/lookup-branch/:code
 */
export const lookupBranchByPostalCode = async (req, res, next) => {
  try {
    const code = (req.params.code || '').trim();
    if (!code) return res.status(400).json({ success: false, error: 'Postal code is required' });

    // ── Priority 1: Postal Code Master (branchCode assignment) ───────────────
    const pc = await PostalCode.findOne({ code, status: 'Active' })
      .populate('branchCode', '_id code name city')
      .lean();

    if (pc?.branchCode) {
      return res.status(200).json({
        success: true,
        data: {
          postalCode: pc.code,
          suburb:     pc.suburb   || '',
          city:       pc.city     || '',
          province:   pc.province || '',
          branch:     pc.branchCode,
          source:     'postal-code-master',
        },
      });
    }

    // ── Priority 2: Fallback — check if any Branch has this postalCode ────────
    const Branch = (await import('../models/Branch.js')).default;
    const branch = await Branch.findOne({
      postalCode: code,
      status:     'Active',
    }).select('_id code name city').lean();

    if (branch) {
      return res.status(200).json({
        success: true,
        data: {
          postalCode: code,
          suburb:     '',
          city:       branch.city || '',
          province:   '',
          branch:     { _id: branch._id, code: branch.code, name: branch.name },
          source:     'branch-address',
        },
      });
    }

    // ── Not found in either source ────────────────────────────────────────────
    return res.status(404).json({
      success: false,
      error: `Postal code '${code}' not found. Add it in Master Data → Geography → Postal Codes and assign a branch.`,
    });
  } catch (e) { next(e); }
};
