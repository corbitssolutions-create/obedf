import ExchangeRate from '../models/ExchangeRate.js';
import { buildQuery } from '../utils/queryHelper.js';

const POPULATE = [
  { path: 'fromCurrency', select: 'code symbol name' },
  { path: 'toCurrency',   select: 'code symbol name' },
];

export const getExchangeRates = async (req, res, next) => {
  try {
    const result = await buildQuery(ExchangeRate, req.query, ['source'], {}, POPULATE);
    res.status(200).json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const getExchangeRateById = async (req, res, next) => {
  try {
    const doc = await ExchangeRate.findById(req.params.id).populate(POPULATE).lean();
    if (!doc) return res.status(404).json({ success: false, error: 'Exchange rate not found' });
    res.status(200).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

export const createExchangeRate = async (req, res, next) => {
  try {
    if (!req.body.fromCurrency || !req.body.toCurrency || !req.body.rate || !req.body.effectiveDate)
      return res.status(400).json({ success: false, error: 'fromCurrency, toCurrency, rate and effectiveDate are required' });
    const doc = await ExchangeRate.create({ ...req.body, createdBy: req.user?._id });
    res.status(201).json({ success: true, message: 'Exchange rate created', data: doc });
  } catch (e) { next(e); }
};

export const updateExchangeRate = async (req, res, next) => {
  try {
    const doc = await ExchangeRate.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Exchange rate not found' });
    const updated = await ExchangeRate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Exchange rate updated', data: updated });
  } catch (e) { next(e); }
};

export const deleteExchangeRate = async (req, res, next) => {
  try {
    const doc = await ExchangeRate.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Exchange rate not found' });
    await doc.deleteOne();
    res.status(200).json({ success: true, message: 'Exchange rate deleted' });
  } catch (e) { next(e); }
};
