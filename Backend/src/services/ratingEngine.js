/**
 * Freight Flow — Rating Engine
 *
 * Responsibilities:
 *  1. Resolve the Delivery Area from a receiver postal code.
 *  2. Locate the correct FreightRate rows (account-specific first, company default fallback).
 *  3. Execute the correct calculation for the matched Rate Type.
 *  4. Return a breakdown object ready to be stored on the Waybill.
 *
 * Design rules:
 *  - Zero hardcoded values.  All slabs, rates, and areas come from the database.
 *  - Each Rate Type has its own pure calculation function.
 *  - Adding a new Rate Type only requires a new entry in CALCULATORS — no other code changes.
 *  - All monetary results are rounded to 2 decimal places.
 */

import PostalCode  from '../models/PostalCode.js';
import FreightRate from '../models/FreightRate.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Resolve the DeliveryArea ObjectId for a receiver postal code string.
 * Returns null when the postal code is not in the master or has no area mapped.
 */
const resolveDeliveryArea = async (postalCodeStr) => {
  if (!postalCodeStr) return null;
  const code = postalCodeStr.toString().trim();
  const pc   = await PostalCode.findOne({ code, status: 'Active' })
    .select('deliveryArea')
    .lean();
  return pc?.deliveryArea || null;
};

/**
 * Load FreightRate rows for a given scope + dimensions.
 *
 * Priority:
 *   1. billingAccount-specific rows (when billingAccountId is provided)
 *   2. Company default rows        (billingAccount = null)
 *
 * Only rows that are Active and within their effective/expiry window are returned.
 * Rows are sorted weightFrom ASC so the slab engine can process them in order.
 */
const loadRates = async ({ billingAccountId, serviceTypeId, deliveryAreaId, rateType }) => {
  const today = new Date();

  const baseFilter = {
    serviceType:  serviceTypeId,
    deliveryArea: deliveryAreaId,
    rateType,
    status: 'Active',
    effectiveDate: { $lte: today },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: today } }],
  };

  // 1. Account-specific rows
  if (billingAccountId) {
    const accountRates = await FreightRate.find({
      ...baseFilter,
      billingAccount: billingAccountId,
    })
      .sort({ weightFrom: 1 })
      .lean();

    if (accountRates.length > 0) {
      return { rates: accountRates, source: 'account' };
    }
  }

  // 2. Company default rows (billingAccount = null)
  const companyRates = await FreightRate.find({
    ...baseFilter,
    billingAccount: null,
  })
    .sort({ weightFrom: 1 })
    .lean();

  return { rates: companyRates, source: 'company' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Rate Type Calculators
// Each function receives (rates, inputs) and returns { amount, breakdown }.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * WEIGHT_SLAB
 *
 * Slabs are sorted by weightFrom ASC.  The engine finds the matching slab for
 * the given weight.  For the open-ended (last) slab (weightTo = null) the
 * formula is:
 *
 *   amount = baseRate + ((weight − weightFrom) × additionalRatePerKg)
 *
 * All other slabs return their baseRate directly.
 * This logic is fully dynamic — no slab ranges are ever hardcoded.
 */
const calcWeightSlab = (rates, { totalWeight }) => {
  if (!rates.length) return null;

  // Sort ascending just in case (DB query already does this, defensive copy)
  const slabs = [...rates].sort((a, b) => a.weightFrom - b.weightFrom);

  // Find the matching slab
  let matched = null;
  for (const slab of slabs) {
    const from = slab.weightFrom ?? 0;
    const to   = slab.weightTo;           // null means open-ended (∞)

    if (totalWeight >= from && (to === null || totalWeight <= to)) {
      matched = slab;
      break;
    }
  }

  // Fallback: if weight exceeds all explicit slabs pick the last one
  if (!matched) {
    matched = slabs[slabs.length - 1];
  }

  const from   = matched.weightFrom ?? 0;
  const isOpen = matched.weightTo === null || matched.weightTo === undefined;

  let amount;
  let formula;

  if (isOpen && matched.additionalRatePerKg > 0) {
    const excess = Math.max(0, totalWeight - from);
    amount  = round2(matched.baseRate + excess * matched.additionalRatePerKg);
    formula = `R${matched.baseRate} + (${excess}kg × R${matched.additionalRatePerKg}/kg)`;
  } else {
    amount  = round2(matched.baseRate);
    formula = `Slab base rate R${matched.baseRate}`;
  }

  return {
    amount,
    breakdown: {
      rateType:    'WEIGHT_SLAB',
      slabFrom:    from,
      slabTo:      matched.weightTo,
      baseRate:    matched.baseRate,
      additionalRatePerKg: matched.additionalRatePerKg,
      weightUsed:  totalWeight,
      formula,
    },
  };
};

/**
 * PER_KG
 *
 * amount = totalWeight × baseRate
 * One row per deliveryArea is expected.
 */
const calcPerKg = (rates, { totalWeight }) => {
  if (!rates.length) return null;
  const rate   = rates[0];
  const amount = round2(totalWeight * rate.baseRate);
  return {
    amount,
    breakdown: {
      rateType:   'PER_KG',
      ratePerKg:  rate.baseRate,
      weightUsed: totalWeight,
      formula:    `${totalWeight}kg × R${rate.baseRate}/kg`,
    },
  };
};

/**
 * FLAT_RATE
 *
 * amount = baseRate  (weight and parcel count are irrelevant)
 */
const calcFlatRate = (rates) => {
  if (!rates.length) return null;
  const rate = rates[0];
  return {
    amount: round2(rate.baseRate),
    breakdown: {
      rateType: 'FLAT_RATE',
      flatRate: rate.baseRate,
      formula:  `Flat rate R${rate.baseRate}`,
    },
  };
};

/**
 * PER_PARCEL
 *
 * amount = parcelCount × baseRate
 */
const calcPerParcel = (rates, { parcelCount }) => {
  if (!rates.length) return null;
  const rate   = rates[0];
  const amount = round2(parcelCount * rate.baseRate);
  return {
    amount,
    breakdown: {
      rateType:    'PER_PARCEL',
      ratePerParcel: rate.baseRate,
      parcelCount,
      formula:     `${parcelCount} parcels × R${rate.baseRate}/parcel`,
    },
  };
};

/**
 * VOLUMETRIC
 *
 * amount = chargeableWeight × baseRate
 * chargeableWeight is the greater of actual weight and volumetric weight,
 * already stored on the Waybill (computed per-parcel).
 */
const calcVolumetric = (rates, { chargeableWeight }) => {
  if (!rates.length) return null;
  const rate   = rates[0];
  const amount = round2(chargeableWeight * rate.baseRate);
  return {
    amount,
    breakdown: {
      rateType:         'VOLUMETRIC',
      ratePerChargeableKg: rate.baseRate,
      chargeableWeight,
      formula:          `${chargeableWeight}kg × R${rate.baseRate}/chargeable kg`,
    },
  };
};

/**
 * PER_WAYBILL
 *
 * One fixed amount per waybill document — weight, parcels, and pieces are ignored.
 */
const calcPerWaybill = (rates) => {
  if (!rates.length) return null;
  const rate = rates[0];
  return {
    amount: round2(rate.baseRate),
    breakdown: {
      rateType:     'PER_WAYBILL',
      ratePerWaybill: rate.baseRate,
      formula:      `Fixed per waybill R${rate.baseRate}`,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Calculator registry
// To add a new Rate Type: add one entry here — nothing else changes.
// ─────────────────────────────────────────────────────────────────────────────
const CALCULATORS = {
  WEIGHT_SLAB: calcWeightSlab,
  PER_KG:      calcPerKg,
  FLAT_RATE:   calcFlatRate,
  PER_PARCEL:  calcPerParcel,
  VOLUMETRIC:  calcVolumetric,
  PER_WAYBILL: calcPerWaybill,
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * resolveDeliveryAreaFromPostalCode
 *
 * Exposed separately so the waybill controller can store the resolved
 * deliveryArea on the waybill document even before calling calculateFreight.
 *
 * @param {string} postalCodeStr
 * @returns {ObjectId|null}
 */
export { resolveDeliveryArea as resolveDeliveryAreaFromPostalCode };

/**
 * calculateFreight
 *
 * Main entry point used by the waybill controller.
 *
 * @param {object} params
 * @param {string|null}   params.billingAccountId   — BillingAccount _id (null for company rates)
 * @param {string}        params.serviceTypeCode     — ServiceType code string (e.g. 'OVERNIGHT')
 * @param {string}        params.serviceTypeId       — ServiceType _id (ObjectId string)
 * @param {string}        params.receiverPostalCode  — e.g. '2196'
 * @param {string}        params.rateTypeCode        — e.g. 'WEIGHT_SLAB'
 * @param {number}        params.totalWeight         — sum of all parcel weights (kg)
 * @param {number}        params.parcelCount         — number of parcels (quantity)
 * @param {number}        params.chargeableWeight    — max(actual, volumetric) weight
 * @param {string|null}   params.deliveryAreaId      — pre-resolved deliveryArea _id (optional optimisation)
 *
 * @returns {object} result
 * @returns {number}        result.freightAmount      — the calculated road freight charge
 * @returns {string|null}   result.deliveryAreaId     — resolved delivery area _id
 * @returns {string}        result.rateSource         — 'account' | 'company' | 'none'
 * @returns {object|null}   result.breakdown          — calculation detail for transparency
 * @returns {string|null}   result.error              — human-readable message when calc not possible
 */
export const calculateFreight = async ({
  billingAccountId  = null,
  serviceTypeId,
  receiverPostalCode,
  rateTypeCode,
  totalWeight       = 0,
  parcelCount       = 1,
  chargeableWeight  = 0,
  deliveryAreaId    = null,
}) => {
  const NOT_FOUND = (msg) => ({
    freightAmount:  0,
    deliveryAreaId: deliveryAreaId || null,
    rateSource:     'none',
    breakdown:      null,
    error:          msg,
  });

  // 1. Resolve delivery area if not already provided
  const resolvedAreaId = deliveryAreaId
    || await resolveDeliveryArea(receiverPostalCode);

  if (!resolvedAreaId) {
    return NOT_FOUND(
      `No Delivery Area mapped to postal code "${receiverPostalCode}". ` +
      'Please map the postal code to a Delivery Area in the master data.'
    );
  }

  // 2. Normalise rateType to uppercase
  const rateType = (rateTypeCode || '').toString().toUpperCase().replace(/[\s-]/g, '_');

  // 3. Validate that we have a calculator for this rate type
  if (!CALCULATORS[rateType]) {
    return NOT_FOUND(
      `Rate type "${rateTypeCode}" is not supported by the engine. ` +
      `Supported types: ${Object.keys(CALCULATORS).join(', ')}.`
    );
  }

  // 4. Load matching rate rows from the database
  const { rates, source } = await loadRates({
    billingAccountId,
    serviceTypeId,
    deliveryAreaId: resolvedAreaId,
    rateType,
  });

  if (!rates.length) {
    return NOT_FOUND(
      `No active FreightRate found for ` +
      `rateType=${rateType}, deliveryArea=${resolvedAreaId}, ` +
      `serviceType=${serviceTypeId}` +
      (billingAccountId ? `, billingAccount=${billingAccountId}` : ' (company default)') + '.'
    );
  }

  // 5. Execute the calculator
  const inputs = { totalWeight, parcelCount, chargeableWeight };
  const result = CALCULATORS[rateType](rates, inputs);

  if (!result) {
    return NOT_FOUND('Calculator returned no result — check rate configuration.');
  }

  return {
    freightAmount:  result.amount,
    deliveryAreaId: resolvedAreaId,
    rateSource:     source,
    breakdown:      result.breakdown,
    error:          null,
  };
};

/**
 * previewFreight
 *
 * Same as calculateFreight but accepts a pre-resolved deliveryAreaId directly
 * (skips postal code lookup).  Used by the rating preview endpoint.
 */
export const previewFreight = async (params) => calculateFreight(params);
