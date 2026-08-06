import Waybill from '../models/Waybill.js';
import BillingAccount from '../models/BillingAccount.js';
import Company from '../models/Company.js';
import PostalCode from '../models/PostalCode.js';
import User from '../models/User.js';
import { getNextWaybillNumber, getNextProductCode } from '../utils/counterHelper.js';
import { calculateFreight, resolveDeliveryAreaFromPostalCode } from '../services/ratingEngine.js';

/**
 * Helper: computes volumetric weight
 */
const computeVolumetricWeight = (l = 0, w = 0, h = 0) => {
  return (l * w * h) / 5000;
};

/**
 * Helper: generates parcels array sequentially
 */
const generateParcels = (waybillNo, quantity, clientParcels = []) => {
  const parcels = [];
  for (let i = 1; i <= quantity; i++) {
    const parcelId   = `${waybillNo}-${String(i).padStart(2, '0')}`;
    const clientData = clientParcels[i - 1] || {};

    const weight           = clientData.weight || 0;
    const length           = clientData.length || 0;
    const width            = clientData.width  || 0;
    const height           = clientData.height || 0;
    const volumetricWeight = computeVolumetricWeight(length, width, height);

    parcels.push({ id: parcelId, weight, length, width, height, volumetricWeight });
  }
  return parcels;
};

/**
 * Helper: fetch billing account defaults and merge with request body values.
 *
 * Priority rules:
 *  1. Request body value (user explicit override) — always wins.
 *  2. Billing Account level defaults.
 *  3. Company level defaults (fallback when account has no value / no account).
 *
 * Extra charges priority:
 *  - Account-level active charges → use them.
 *  - No account charges → fall back to Company-level active charges.
 *
 * Returns a plain object of resolved defaults.
 */
/**
 * Helper: determine AT Branch and TO Branch, and derive waybill status.
 *
 * AT Branch — from the logged-in user's first branch assignment.
 * TO Branch — from the receiver postal code via PostalCode Master (branchCode field).
 * Status    — 'To Deliver'  if AT Branch === TO Branch (same branch, local delivery).
 *             'To Manifest' if AT Branch !== TO Branch (inter-branch, needs manifesting).
 *             'Active'      if neither branch can be determined (fallback).
 */
const resolveBranchAndStatus = async (userId, receiverPostalCode) => {
  let atBranch = null;
  let toBranch = null;

  // AT Branch — from logged-in user's branch assignments
  if (userId) {
    const user = await User.findById(userId)
      .select('branches')
      .populate('branches', '_id code name')
      .lean();
    if (user?.branches?.length > 0) {
      atBranch = user.branches[0]._id;
    }
  }

  // TO Branch — from receiver postal code (Postal Code Master first, then Branch address fallback)
  if (receiverPostalCode) {
    const code = receiverPostalCode.toString().trim();

    // Priority 1: Postal Code Master
    const pc = await PostalCode.findOne({ code, status: 'Active' }).lean();
    if (pc?.branchCode) {
      toBranch = pc.branchCode;
    } else {
      // Priority 2: fallback — find branch whose own postalCode matches
      const Branch = (await import('../models/Branch.js')).default;
      const branch = await Branch.findOne({ postalCode: code, status: 'Active' })
        .select('_id').lean();
      if (branch) toBranch = branch._id;
    }
  }

  // Status logic per business rules
  let status = 'Active'; // fallback when branches unknown
  if (atBranch && toBranch) {
    status = atBranch.toString() === toBranch.toString()
      ? 'To Deliver'   // same branch → local delivery
      : 'To Manifest'; // different branches → needs manifesting
  } else if (atBranch && !toBranch) {
    // Postal code not in master — default to To Deliver (will be corrected later)
    status = 'To Deliver';
  }

  return { atBranch, toBranch, status };
};

const resolveBillingDefaults = async (billingAccountId, body) => {
  const defaults = {};

  // ── 1. Load company defaults (always needed as final fallback) ─────────────
  const company = await Company.findOne({})
    .select('defaultRateType defaultServiceType defaultPaymentType defaultPaymentCollectionType companyExtraCharges')
    .populate('defaultRateType',    'code name unit')
    .populate('defaultServiceType', 'code name transitDays')
    .populate('companyExtraCharges.extraCharge', 'chargeCode chargeName chargeType defaultAmount')
    .lean();

  // ── 2. Load billing account (if given) ────────────────────────────────────
  let account = null;
  if (billingAccountId) {
    account = await BillingAccount.findById(billingAccountId)
      .select('billingContactPerson billingEmail billingPhone defaultRateType defaultServiceType defaultPaymentType paymentCollectionType extraCharges')
      .populate('defaultRateType',    'code name unit')
      .populate('defaultServiceType', 'code name transitDays')
      .populate('extraCharges.extraCharge', 'chargeCode chargeName chargeType defaultAmount')
      .lean();
  }

  // ── 3. Resolve each field: request > account > company ────────────────────

  // Billing contact — only from account level
  if (!body.billingContactPerson && account?.billingContactPerson)
    defaults.billingContactPerson = account.billingContactPerson;
  if (!body.billingEmail && account?.billingEmail)
    defaults.billingEmail = account.billingEmail;
  if (!body.billingPhone && account?.billingPhone)
    defaults.billingPhone = account.billingPhone;

  // Rate type (code string on waybill)
  if (!body.rateType) {
    const src = account?.defaultRateType || company?.defaultRateType;
    if (src) defaults.rateType = src.code;
  }

  // Service type
  if (!body.serviceType) {
    const src = account?.defaultServiceType || company?.defaultServiceType;
    if (src) defaults.serviceType = src.code;
  }

  // Payment type
  if (!body.paymentType) {
    const src = account?.defaultPaymentType || company?.defaultPaymentType;
    if (src) defaults.paymentType = src;
  }

  // Payment collection type
  if (!body.paymentCollectionType) {
    const src = account?.paymentCollectionType || company?.defaultPaymentCollectionType;
    if (src) defaults.paymentCollectionType = src;
  }

  // ── 4. Extra charges priority: account → company ──────────────────────────
  const requestHasCharges = Array.isArray(body.extraCharges) && body.extraCharges.length > 0;
  if (!requestHasCharges) {
    // Try account-level first
    const accountActiveCharges = (account?.extraCharges || [])
      .filter(c => c.status === 'Active' && c.extraCharge);

    if (accountActiveCharges.length > 0) {
      defaults.extraCharges = accountActiveCharges.map(c => ({
        extraChargeId:  c.extraCharge._id,
        chargeCode:     c.extraCharge.chargeCode,
        chargeName:     c.extraCharge.chargeName,
        chargeType:     c.extraCharge.chargeType,
        defaultAmount:  c.extraCharge.defaultAmount,
        amount:         c.amount,
      }));
    } else {
      // Fall back to company-level charges
      const companyActiveCharges = (company?.companyExtraCharges || [])
        .filter(c => c.status === 'Active' && c.extraCharge);

      if (companyActiveCharges.length > 0) {
        defaults.extraCharges = companyActiveCharges.map(c => ({
          extraChargeId:  c.extraCharge._id,
          chargeCode:     c.extraCharge.chargeCode,
          chargeName:     c.extraCharge.chargeName,
          chargeType:     c.extraCharge.chargeType,
          defaultAmount:  c.extraCharge.defaultAmount,
          amount:         c.amount,
        }));
      }
    }
  }

  return defaults;
};

/**
 * Helper: resolve the ServiceType ObjectId from its code string.
 * Used so the rating engine can query FreightRate by serviceType ObjectId.
 */
const resolveServiceTypeId = async (serviceTypeCode) => {
  if (!serviceTypeCode) return null;
  const ServiceType = (await import('../models/ServiceType.js')).default;
  const st = await ServiceType.findOne({ code: serviceTypeCode.trim().toUpperCase(), status: 'Active' })
    .select('_id')
    .lean();
  return st?._id || null;
};

/**
 * Helper: compute waybill totals from parcels + resolved freight amount.
 *
 *  totalWeight      — sum of all parcel actual weights
 *  chargeableWeight — sum of max(actual, volumetric) per parcel
 *  parcelCount      — number of parcels
 *  roadFreightTotal — result of rating engine
 *  extraChargesTotal— sum of extra charges
 *    Fixed:       charge.amount
 *    Percentage:  charge.amount % of roadFreightTotal
 *  grandTotal       — roadFreightTotal + extraChargesTotal
 */
const computeWaybillTotals = (parcels = [], freightAmount = 0, extraCharges = []) => {
  let totalWeight      = 0;
  let chargeableWeight = 0;

  for (const p of parcels) {
    const actual     = p.weight           || 0;
    const volumetric = p.volumetricWeight || 0;
    totalWeight      += actual;
    chargeableWeight += Math.max(actual, volumetric);
  }

  // Round to 2 dp
  totalWeight      = Math.round((totalWeight      + Number.EPSILON) * 100) / 100;
  chargeableWeight = Math.round((chargeableWeight + Number.EPSILON) * 100) / 100;

  const roadFreightTotal = Math.round((freightAmount + Number.EPSILON) * 100) / 100;

  let extraChargesTotal = 0;
  for (const c of extraCharges) {
    const amt = Number(c.amount) || 0;
    if (c.chargeType === 'Percentage') {
      extraChargesTotal += (roadFreightTotal * amt) / 100;
    } else {
      extraChargesTotal += amt;
    }
  }
  extraChargesTotal = Math.round((extraChargesTotal + Number.EPSILON) * 100) / 100;

  const grandTotal = Math.round((roadFreightTotal + extraChargesTotal + Number.EPSILON) * 100) / 100;

  return { totalWeight, chargeableWeight, roadFreightTotal, extraChargesTotal, grandTotal };
};

/**
 * @desc    Create a new Waybill
 * @route   POST /api/waybills
 * @access  Protected
 */
export const createWaybill = async (req, res, next) => {
  try {
    // 1. Generate unique sequential identifiers
    const waybillNo   = await getNextWaybillNumber();
    const productCode = await getNextProductCode();

    const {
      billingAccount,
      sender,
      pickupPoint,
      senderContact,
      senderEmail,
      senderAddress,
      senderWechat,
      billingContactPerson,
      billingEmail,
      billingPhone,
      paymentType,
      paymentCollectionType,
      extraCharges,
      receiver,
      deliveryPoint,
      receiverContact,
      receiverEmail,
      receiverAddress,
      billingSameAsReceiver,
      billingAddress,
      receivingHours,
      serviceType,
      rateType,
      charges,
      specialInstructions,
      quantity,
      parcels: clientParcels,
      status,
    } = req.body;

    // 2. Resolve billing account defaults — only fills gaps not already in the request
    const accountDefaults = await resolveBillingDefaults(billingAccount, req.body);

    // 3. Determine AT Branch (from user) + TO Branch (from receiver postal code)
    const receiverPostalCode = receiverAddress?.postalCode || '';
    const branchInfo = await resolveBranchAndStatus(req.user?._id, receiverPostalCode);

    // 4. Generate sequential parcels
    const parcels = generateParcels(waybillNo, quantity || 1, clientParcels);

    // 5. Resolve final serviceType / rateType strings
    const resolvedServiceType = serviceType || accountDefaults.serviceType || '';
    const resolvedRateType    = rateType    || accountDefaults.rateType    || '';

    // 6. Resolve extra charges list
    const resolvedExtraCharges = (Array.isArray(extraCharges) && extraCharges.length > 0)
      ? extraCharges
          .filter(c => (c.chargeName || c.description || '').trim() !== '')
          .map(c => ({
            extraChargeId:  c.extraChargeId  || undefined,
            chargeCode:     c.chargeCode     || undefined,
            chargeName:     c.chargeName     || c.description || '',
            chargeType:     c.chargeType     || 'Fixed',
            defaultAmount:  Number(c.defaultAmount) || 0,
            amount:         Number(c.amount)        || 0,
          }))
      : (accountDefaults.extraCharges || []);

    // 7. ── Rating Engine ──────────────────────────────────────────────────────
    //    Resolve ServiceType ObjectId so the engine can query FreightRate rows.
    const serviceTypeId = await resolveServiceTypeId(resolvedServiceType);

    // Compute weight inputs from the generated parcels
    let totalWeight      = 0;
    let chargeableWeight = 0;
    for (const p of parcels) {
      const actual     = p.weight           || 0;
      const volumetric = p.volumetricWeight || 0;
      totalWeight      += actual;
      chargeableWeight += Math.max(actual, volumetric);
    }
    totalWeight      = Math.round((totalWeight      + Number.EPSILON) * 100) / 100;
    chargeableWeight = Math.round((chargeableWeight + Number.EPSILON) * 100) / 100;

    // Run the engine — non-fatal: if no rate is configured the waybill still saves
    // with roadFreightTotal = 0 and a rateSource = 'none' indicator.
    const ratingResult = await calculateFreight({
      billingAccountId:  billingAccount  || null,
      serviceTypeId:     serviceTypeId   || null,
      receiverPostalCode,
      rateTypeCode:      resolvedRateType,
      totalWeight,
      parcelCount:       quantity || 1,
      chargeableWeight,
    });

    // 8. Compute all monetary totals
    const totals = computeWaybillTotals(
      parcels,
      ratingResult.freightAmount,
      resolvedExtraCharges
    );

    const waybill = await Waybill.create({
      waybillNo,
      productCode,
      date:           new Date(),
      billingAccount: billingAccount || null,

      // AT Branch (collection) = user's branch; TO Branch = derived from postal code
      atBranch: branchInfo.atBranch || null,
      toBranch: branchInfo.toBranch || null,

      sender,
      pickupPoint:    pickupPoint || sender,
      senderContact,
      senderEmail,
      senderAddress,
      senderWechat,

      // Billing contact — request value wins, then account default
      billingContactPerson: billingContactPerson || accountDefaults.billingContactPerson || '',
      billingEmail:         billingEmail         || accountDefaults.billingEmail         || '',
      billingPhone:         billingPhone         || accountDefaults.billingPhone         || '',

      // Payment
      paymentType:           paymentType           || accountDefaults.paymentType           || '',
      paymentCollectionType: paymentCollectionType || accountDefaults.paymentCollectionType || '',

      receiver,
      deliveryPoint,
      receiverContact,
      receiverEmail,
      receiverAddress,
      billingSameAsReceiver,
      billingAddress: billingSameAsReceiver ? receiverAddress : billingAddress,
      receivingHours,

      // Rate & service
      serviceType: resolvedServiceType,
      rateType:    resolvedRateType,

      // ── Rating engine results ──────────────────────────────────────────────
      deliveryArea:       ratingResult.deliveryAreaId || null,
      rateSource:         ratingResult.rateSource     || 'none',
      rateBreakdown:      ratingResult.breakdown      || null,

      charges,
      specialInstructions,
      quantity: quantity || 1,
      parcels,

      extraCharges: resolvedExtraCharges,

      // ── Computed totals ────────────────────────────────────────────────────
      roadFreightTotal:  totals.roadFreightTotal,
      extraChargesTotal: totals.extraChargesTotal,
      grandTotal:        totals.grandTotal,

      // Status: Draft preserved explicitly; otherwise auto-determined by branch logic
      status: status === 'Draft' ? 'Draft' : branchInfo.status,
    });

    res.status(201).json({
      success: true,
      message: 'Waybill created successfully',
      data: waybill,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all Waybills (with filtering, sorting, pagination, and searching)
 * @route   GET /api/waybills
 * @access  Protected
 */
export const getWaybills = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, sort } = req.query;

    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { waybillNo: { $regex: search, $options: 'i' } },
        { sender:    { $regex: search, $options: 'i' } },
        { receiver:  { $regex: search, $options: 'i' } },
      ];
    }

    let sortBy = { createdAt: -1 };
    if (sort) {
      const parts = sort.split(':');
      sortBy = { [parts[0]]: parts[1] === 'desc' ? -1 : 1 };
    }

    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const total    = await Waybill.countDocuments(query);
    const waybills = await Waybill.find(query)
      .populate('billingAccount', 'billingAccountCode billingAccountName')
      .populate('atBranch',       '_id code name')
      .populate('toBranch',       '_id code name')
      .populate('deliveryArea',   'code name')
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      data: waybills,
      pagination: {
        page:  pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single Waybill by ID or WaybillNo
 * @route   GET /api/waybills/:id
 * @access  Protected
 */
export const getWaybillById = async (req, res, next) => {
  try {
    const idOrNo = req.params.id;
    const query  = idOrNo.startsWith('WB') ? { waybillNo: idOrNo } : { _id: idOrNo };

    const waybill = await Waybill.findOne(query)
      .populate('billingAccount', 'billingAccountCode billingAccountName billingContactPerson billingEmail billingPhone')
      .populate('atBranch',     '_id code name')
      .populate('toBranch',     '_id code name')
      .populate('deliveryArea', 'code name');

    if (!waybill) {
      return res.status(404).json({ success: false, error: 'Waybill not found' });
    }

    res.status(200).json({ success: true, data: waybill });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a Waybill
 * @route   PUT /api/waybills/:id
 * @access  Protected
 */
export const updateWaybill = async (req, res, next) => {
  try {
    let waybill = await Waybill.findById(req.params.id);

    if (!waybill) {
      return res.status(404).json({ success: false, error: 'Waybill not found' });
    }

    const updates = { ...req.body };

    // Immutable fields — never allow override
    delete updates.waybillNo;
    delete updates.productCode;
    delete updates.date;

    // Re-generate parcels if quantity changes
    if (updates.quantity && parseInt(updates.quantity) !== waybill.quantity) {
      updates.parcels = generateParcels(
        waybill.waybillNo,
        parseInt(updates.quantity),
        updates.parcels || waybill.parcels
      );
    } else if (updates.parcels) {
      // Recompute volumetric weights for explicit parcel updates
      updates.parcels = updates.parcels.map((p, index) => {
        const id               = p.id || `${waybill.waybillNo}-${String(index + 1).padStart(2, '0')}`;
        const volumetricWeight = computeVolumetricWeight(p.length || 0, p.width || 0, p.height || 0);
        return { ...p, id, volumetricWeight };
      });
    }

    // ── Re-run Rating Engine if pricing inputs changed ────────────────────────
    const pricingChanged =
      updates.parcels           !== undefined ||
      updates.quantity          !== undefined ||
      updates.rateType          !== undefined ||
      updates.serviceType       !== undefined ||
      updates.billingAccount    !== undefined ||
      updates.receiverAddress   !== undefined ||
      updates.extraCharges      !== undefined;

    if (pricingChanged) {
      // Merge updated values with existing waybill values for engine inputs
      const finalParcels       = updates.parcels       || waybill.parcels       || [];
      const finalRateType      = updates.rateType      || waybill.rateType      || '';
      const finalServiceType   = updates.serviceType   || waybill.serviceType   || '';
      const finalBillingAcct   = updates.billingAccount !== undefined
        ? updates.billingAccount
        : waybill.billingAccount;
      const finalPostalCode    = updates.receiverAddress?.postalCode
        || waybill.receiverAddress?.postalCode
        || '';
      const finalQty           = parseInt(updates.quantity || waybill.quantity || 1);
      const finalExtraCharges  = updates.extraCharges  || waybill.extraCharges  || [];

      const serviceTypeId = await resolveServiceTypeId(finalServiceType);

      let totalWeight      = 0;
      let chargeableWeight = 0;
      for (const p of finalParcels) {
        const actual     = p.weight           || 0;
        const volumetric = p.volumetricWeight || 0;
        totalWeight      += actual;
        chargeableWeight += Math.max(actual, volumetric);
      }
      totalWeight      = Math.round((totalWeight      + Number.EPSILON) * 100) / 100;
      chargeableWeight = Math.round((chargeableWeight + Number.EPSILON) * 100) / 100;

      const ratingResult = await calculateFreight({
        billingAccountId:  finalBillingAcct || null,
        serviceTypeId:     serviceTypeId    || null,
        receiverPostalCode: finalPostalCode,
        rateTypeCode:      finalRateType,
        totalWeight,
        parcelCount:       finalQty,
        chargeableWeight,
      });

      const totals = computeWaybillTotals(
        finalParcels,
        ratingResult.freightAmount,
        finalExtraCharges
      );

      updates.deliveryArea      = ratingResult.deliveryAreaId || waybill.deliveryArea || null;
      updates.rateSource        = ratingResult.rateSource     || 'none';
      updates.rateBreakdown     = ratingResult.breakdown      || null;
      updates.roadFreightTotal  = totals.roadFreightTotal;
      updates.extraChargesTotal = totals.extraChargesTotal;
      updates.grandTotal        = totals.grandTotal;
    }

    waybill = await Waybill.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('billingAccount', 'billingAccountCode billingAccountName')
      .populate('deliveryArea',   'code name');

    res.status(200).json({
      success: true,
      message: 'Waybill updated successfully',
      data: waybill,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a Waybill
 * @route   DELETE /api/waybills/:id
 * @access  Protected
 */
export const deleteWaybill = async (req, res, next) => {
  try {
    const waybill = await Waybill.findById(req.params.id);

    if (!waybill) {
      return res.status(404).json({ success: false, error: 'Waybill not found' });
    }

    await waybill.deleteOne();

    res.status(200).json({ success: true, message: 'Waybill deleted successfully' });
  } catch (error) {
    next(error);
  }
};
