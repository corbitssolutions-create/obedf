/**
 * Rating Controller
 *
 * Covers:
 *  A. DeliveryArea  — full CRUD + lookup
 *  B. FreightRate   — full CRUD (list, create, get, update, delete)
 *                     scoped to either company (default) or a billing account
 *  C. Preview       — POST /api/ratings/preview
 *                     Run the engine against supplied inputs without saving
 *  D. Resolve area  — GET /api/ratings/resolve-area/:postalCode
 *                     Return the DeliveryArea for a postal code (used by frontend)
 */

import mongoose        from 'mongoose';
import DeliveryArea    from '../models/DeliveryArea.js';
import FreightRate     from '../models/FreightRate.js';
import ServiceType     from '../models/ServiceType.js';
import { calculateFreight, resolveDeliveryAreaFromPostalCode } from '../services/ratingEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// A. Delivery Areas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ratings/delivery-areas
 * List all delivery areas (with optional ?status= filter and ?search=)
 */
export const getDeliveryAreas = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [total, areas] = await Promise.all([
      DeliveryArea.countDocuments(filter),
      DeliveryArea.find(filter)
        .populate('branch', 'code name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: areas,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ratings/delivery-areas/lookup
 * Lightweight list for dropdowns — only Active areas, minimal fields
 */
export const lookupDeliveryAreas = async (req, res, next) => {
  try {
    const areas = await DeliveryArea.find({ status: 'Active' })
      .select('_id code name')
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, data: areas });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ratings/delivery-areas/:id
 */
export const getDeliveryAreaById = async (req, res, next) => {
  try {
    const area = await DeliveryArea.findById(req.params.id)
      .populate('branch', 'code name')
      .lean();
    if (!area) return res.status(404).json({ success: false, error: 'Delivery Area not found' });
    res.json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ratings/delivery-areas
 */
export const createDeliveryArea = async (req, res, next) => {
  try {
    const { code, name, description, branch, status } = req.body;

    const area = await DeliveryArea.create({
      code,
      name,
      description,
      branch:    branch    || null,
      status:    status    || 'Active',
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: 'Delivery Area created', data: area });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/ratings/delivery-areas/:id
 */
export const updateDeliveryArea = async (req, res, next) => {
  try {
    const { code, name, description, branch, status } = req.body;

    const area = await DeliveryArea.findByIdAndUpdate(
      req.params.id,
      { code, name, description, branch: branch || null, status },
      { new: true, runValidators: true }
    ).populate('branch', 'code name');

    if (!area) return res.status(404).json({ success: false, error: 'Delivery Area not found' });
    res.json({ success: true, message: 'Delivery Area updated', data: area });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/ratings/delivery-areas/:id
 */
export const deleteDeliveryArea = async (req, res, next) => {
  try {
    // Guard: refuse if any FreightRate references this area
    const inUse = await FreightRate.exists({ deliveryArea: req.params.id });
    if (inUse) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete — FreightRate rows reference this Delivery Area.',
      });
    }

    const area = await DeliveryArea.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ success: false, error: 'Delivery Area not found' });
    res.json({ success: true, message: 'Delivery Area deleted' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// B. Freight Rates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ratings/rates
 *
 * Query params:
 *   billingAccount  — ObjectId | 'company'  (company = null scope)
 *   serviceType     — ObjectId
 *   deliveryArea    — ObjectId
 *   rateType        — string
 *   status          — Active | Inactive
 *   page / limit
 */
export const getFreightRates = async (req, res, next) => {
  try {
    const {
      billingAccount,
      serviceType,
      deliveryArea,
      rateType,
      status,
      page  = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    // Scope filter
    if (billingAccount === 'company') {
      filter.billingAccount = null;
    } else if (billingAccount) {
      filter.billingAccount = billingAccount;
    }

    if (serviceType)  filter.serviceType  = serviceType;
    if (deliveryArea) filter.deliveryArea = deliveryArea;
    if (rateType)     filter.rateType     = rateType.toUpperCase();
    if (status)       filter.status       = status;

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [total, rates] = await Promise.all([
      FreightRate.countDocuments(filter),
      FreightRate.find(filter)
        .populate('billingAccount', 'billingAccountCode billingAccountName')
        .populate('serviceType',    'code name')
        .populate('deliveryArea',   'code name')
        .sort({ deliveryArea: 1, rateType: 1, weightFrom: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      success: true,
      data: rates,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ratings/rates/:id
 */
export const getFreightRateById = async (req, res, next) => {
  try {
    const rate = await FreightRate.findById(req.params.id)
      .populate('billingAccount', 'billingAccountCode billingAccountName')
      .populate('serviceType',    'code name')
      .populate('deliveryArea',   'code name')
      .lean();

    if (!rate) return res.status(404).json({ success: false, error: 'Freight Rate not found' });
    res.json({ success: true, data: rate });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ratings/rates
 *
 * Body (all required unless noted):
 *   billingAccount?    — ObjectId  (omit or null for company default)
 *   serviceType        — ObjectId
 *   deliveryArea       — ObjectId
 *   rateType           — WEIGHT_SLAB | PER_KG | FLAT_RATE | PER_PARCEL | VOLUMETRIC | PER_WAYBILL
 *   weightFrom?        — number (WEIGHT_SLAB only)
 *   weightTo?          — number | null  (null = open-ended, WEIGHT_SLAB only)
 *   baseRate           — number
 *   additionalRatePerKg? — number (open-ended WEIGHT_SLAB only)
 *   effectiveDate?     — ISO date
 *   expiryDate?        — ISO date | null
 *   status?            — Active | Inactive
 *   notes?             — string
 */
export const createFreightRate = async (req, res, next) => {
  try {
    const {
      billingAccount,
      serviceType,
      deliveryArea,
      rateType,
      weightFrom,
      weightTo,
      baseRate,
      additionalRatePerKg,
      effectiveDate,
      expiryDate,
      status,
      notes,
    } = req.body;

    const rate = await FreightRate.create({
      billingAccount:      billingAccount      || null,
      serviceType,
      deliveryArea,
      rateType:            rateType.toUpperCase(),
      weightFrom:          weightFrom          ?? 0,
      weightTo:            weightTo            ?? null,
      baseRate:            baseRate            ?? 0,
      additionalRatePerKg: additionalRatePerKg ?? 0,
      effectiveDate:       effectiveDate       || new Date(),
      expiryDate:          expiryDate          || null,
      status:              status              || 'Active',
      notes,
      createdBy:           req.user?._id,
    });

    const populated = await FreightRate.findById(rate._id)
      .populate('billingAccount', 'billingAccountCode billingAccountName')
      .populate('serviceType',    'code name')
      .populate('deliveryArea',   'code name')
      .lean();

    res.status(201).json({ success: true, message: 'Freight Rate created', data: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/ratings/rates/:id
 */
export const updateFreightRate = async (req, res, next) => {
  try {
    const {
      billingAccount,
      serviceType,
      deliveryArea,
      rateType,
      weightFrom,
      weightTo,
      baseRate,
      additionalRatePerKg,
      effectiveDate,
      expiryDate,
      status,
      notes,
    } = req.body;

    const updates = {
      billingAccount:      billingAccount !== undefined ? (billingAccount || null) : undefined,
      serviceType,
      deliveryArea,
      rateType:            rateType ? rateType.toUpperCase() : undefined,
      weightFrom,
      weightTo:            weightTo ?? null,
      baseRate,
      additionalRatePerKg: additionalRatePerKg ?? 0,
      effectiveDate,
      expiryDate:          expiryDate || null,
      status,
      notes,
    };

    // Strip undefined so we don't accidentally null out un-sent fields
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const rate = await FreightRate.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('billingAccount', 'billingAccountCode billingAccountName')
      .populate('serviceType',    'code name')
      .populate('deliveryArea',   'code name');

    if (!rate) return res.status(404).json({ success: false, error: 'Freight Rate not found' });
    res.json({ success: true, message: 'Freight Rate updated', data: rate });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/ratings/rates/:id
 */
export const deleteFreightRate = async (req, res, next) => {
  try {
    const rate = await FreightRate.findByIdAndDelete(req.params.id);
    if (!rate) return res.status(404).json({ success: false, error: 'Freight Rate not found' });
    res.json({ success: true, message: 'Freight Rate deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/ratings/rates/:id/toggle-status
 */
export const toggleFreightRateStatus = async (req, res, next) => {
  try {
    const rate = await FreightRate.findById(req.params.id);
    if (!rate) return res.status(404).json({ success: false, error: 'Freight Rate not found' });

    rate.status = rate.status === 'Active' ? 'Inactive' : 'Active';
    await rate.save();

    res.json({ success: true, message: `Freight Rate ${rate.status}`, data: { status: rate.status } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// C. Preview / calculate without saving
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/ratings/preview
 *
 * Runs the rating engine and returns the result without creating a Waybill.
 * Useful for "Quote" screens and UI price previews.
 *
 * Body:
 *   billingAccount?    — ObjectId  (omit for company rates)
 *   serviceTypeId      — ObjectId
 *   receiverPostalCode — string    (used to look up deliveryArea)
 *   deliveryAreaId?    — ObjectId  (optional override; skips postal code lookup)
 *   rateTypeCode       — WEIGHT_SLAB | PER_KG | FLAT_RATE | PER_PARCEL | VOLUMETRIC | PER_WAYBILL
 *   totalWeight        — number (kg)
 *   parcelCount        — number
 *   chargeableWeight   — number (kg)
 */
export const previewRating = async (req, res, next) => {
  try {
    const {
      billingAccount,
      serviceTypeId,
      receiverPostalCode,
      deliveryAreaId,
      rateTypeCode,
      totalWeight      = 0,
      parcelCount      = 1,
      chargeableWeight = 0,
    } = req.body;

    if (!serviceTypeId) {
      return res.status(400).json({ success: false, error: 'serviceTypeId is required' });
    }
    if (!rateTypeCode) {
      return res.status(400).json({ success: false, error: 'rateTypeCode is required' });
    }
    if (!receiverPostalCode && !deliveryAreaId) {
      return res.status(400).json({
        success: false,
        error: 'Either receiverPostalCode or deliveryAreaId is required',
      });
    }

    const result = await calculateFreight({
      billingAccountId:  billingAccount  || null,
      serviceTypeId,
      receiverPostalCode: receiverPostalCode || '',
      rateTypeCode,
      totalWeight:       Number(totalWeight),
      parcelCount:       Number(parcelCount),
      chargeableWeight:  Number(chargeableWeight),
      deliveryAreaId:    deliveryAreaId  || null,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// D. Resolve delivery area from postal code
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ratings/resolve-area/:postalCode
 *
 * Returns the DeliveryArea document linked to the given postal code.
 * Used by the waybill form to show the user which area will be rated.
 */
export const resolveAreaByPostalCode = async (req, res, next) => {
  try {
    const { postalCode } = req.params;

    const deliveryAreaId = await resolveDeliveryAreaFromPostalCode(postalCode);
    if (!deliveryAreaId) {
      return res.status(404).json({
        success: false,
        error: `No Delivery Area mapped to postal code "${postalCode}"`,
      });
    }

    const area = await DeliveryArea.findById(deliveryAreaId)
      .populate('branch', 'code name')
      .lean();

    res.json({ success: true, data: area });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// E. Rate matrix summary — all slabs for a given scope
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/ratings/matrix
 *
 * Returns the full rate matrix grouped by deliveryArea → rateType for a scope.
 * Query: billingAccount (ObjectId | 'company'), serviceType (ObjectId)
 */
export const getRateMatrix = async (req, res, next) => {
  try {
    const { billingAccount, serviceType } = req.query;

    const filter = { status: 'Active' };
    if (billingAccount === 'company') {
      filter.billingAccount = null;
    } else if (billingAccount) {
      filter.billingAccount = billingAccount;
    }
    if (serviceType) filter.serviceType = serviceType;

    const rates = await FreightRate.find(filter)
      .populate('deliveryArea', 'code name')
      .populate('serviceType',  'code name')
      .sort({ deliveryArea: 1, rateType: 1, weightFrom: 1 })
      .lean();

    // Group: deliveryArea.name → rateType → [rows]
    const matrix = {};
    for (const r of rates) {
      const areaKey = r.deliveryArea?.name || r.deliveryArea?._id?.toString() || 'Unknown';
      const rtKey   = r.rateType;
      if (!matrix[areaKey])    matrix[areaKey] = {};
      if (!matrix[areaKey][rtKey]) matrix[areaKey][rtKey] = [];
      matrix[areaKey][rtKey].push(r);
    }

    res.json({ success: true, data: matrix, raw: rates });
  } catch (err) {
    next(err);
  }
};
