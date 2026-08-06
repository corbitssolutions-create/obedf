import Trailer from '../models/Trailer.js';
import { buildQuery } from '../utils/queryHelper.js';

const SEARCH = ['trailerCode', 'registrationNumber', 'fleetNumber', 'make', 'model', 'vinNumber'];

export const getTrailers = async (req, res, next) => {
  try {
    const result = await buildQuery(Trailer, req.query, SEARCH, {}, [
      { path: 'branch',        select: 'code name city' },
      { path: 'branches',      select: '_id code name' },
      { path: 'currentVehicle',select: 'vehicleCode registrationNumber' },
    ]);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const lookupTrailers = async (req, res, next) => {
  try {
    const items = await Trailer.find({ status: 'Active' })
      .select('_id trailerCode registrationNumber fleetNumber trailerType capacityKg')
      .sort({ trailerCode: 1 }).lean();
    res.status(200).json({ success: true, data: items });
  } catch (e) { next(e); }
};

export const getTrailerById = async (req, res, next) => {
  try {
    const doc = await Trailer.findById(req.params.id)
      .populate('branch', 'code name city')
      .populate('branches', '_id code name')
      .populate('currentVehicle', 'vehicleCode registrationNumber').lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Trailer not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

export const createTrailer = async (req, res, next) => {
  try {
    const { trailerCode, registrationNumber } = req.body;
    if (!registrationNumber?.trim()) return res.status(400).json({ success: false, error: 'Registration number is required' });

    if (await Trailer.findOne({ registrationNumber: registrationNumber.trim().toUpperCase() }))
      return res.status(400).json({ success: false, error: `Registration '${registrationNumber}' already exists` });

    // Auto-generate trailerCode if not provided
    let code = trailerCode?.trim().toUpperCase();
    if (!code) {
      const count = await Trailer.countDocuments({});
      code = `TRL-${String(count + 1).padStart(4, '0')}`;
      let suffix = count + 1;
      while (await Trailer.findOne({ trailerCode: code })) {
        suffix++;
        code = `TRL-${String(suffix).padStart(4, '0')}`;
      }
    }

    const doc = await Trailer.create({ ...req.body, trailerCode: code, createdBy: req.user?._id });
    res.status(201).json({ success: true, message: 'Trailer created', data: doc });
  } catch (e) { next(e); }
};

export const updateTrailer = async (req, res, next) => {
  try {
    const doc = await Trailer.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Trailer not found' });
    const updated = await Trailer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Trailer updated', data: updated });
  } catch (e) { next(e); }
};

export const deleteTrailer = async (req, res, next) => {
  try {
    const doc = await Trailer.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Trailer not found' });
    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Trailer deleted' });
  } catch (e) { next(e); }
};
