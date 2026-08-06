import Supplier from '../models/Supplier.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH = ['supplierCode', 'supplierName', 'contactPerson', 'email', 'phoneNumber', 'vatNumber'];

export const getSuppliers = async (req, res, next) => {
  try {
    const result = await buildQuery(Supplier, req.query, SEARCH, {}, [
      { path: 'paymentTerm', select: 'code name days' },
      { path: 'currency',    select: 'code symbol name' },
    ]);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const lookupSuppliers = async (req, res, next) => {
  try {
    const items = await Supplier.find({ status: 'Active' })
      .select('_id supplierCode supplierName contactPerson phoneNumber email')
      .sort({ supplierName: 1 }).lean();
    res.status(200).json({ success: true, data: items });
  } catch (e) { next(e); }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const doc = await Supplier.findById(req.params.id)
      .populate('paymentTerm', 'code name days')
      .populate('currency', 'code symbol name').lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { supplierCode } = req.body;
    if (!supplierCode) return res.status(400).json({ success: false, error: 'Supplier code is required' });
    const exists = await Supplier.findOne({ supplierCode: supplierCode.trim().toUpperCase() });
    if (exists) return res.status(400).json({ success: false, error: `Supplier code '${supplierCode}' already exists` });
    const doc = await Supplier.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, message: 'Supplier created', data: doc });
  } catch (e) { next(e); }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const doc = await Supplier.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Supplier not found' });
    const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Supplier updated', data: updated });
  } catch (e) { next(e); }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const doc = await Supplier.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Supplier not found' });
    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Supplier deleted' });
  } catch (e) { next(e); }
};
