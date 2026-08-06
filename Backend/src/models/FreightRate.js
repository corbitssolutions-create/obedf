import mongoose from 'mongoose';

/**
 * FreightRate — the core rating matrix row.
 *
 * Scope / priority:
 *   1. If billingAccount is set  → Account-specific rate (checked first)
 *   2. If billingAccount is null → Company default rate  (fallback)
 *
 * Rate Types (rateType string matches RateType.code in master):
 *   WEIGHT_SLAB   — tiered slab; open-ended last slab uses additionalRatePerKg
 *   PER_KG        — totalWeight × baseRate
 *   FLAT_RATE     — fixed amount regardless of weight / parcels
 *   PER_PARCEL    — parcelCount × baseRate
 *   VOLUMETRIC    — chargeableWeight × baseRate
 *   PER_WAYBILL   — fixed amount per waybill document
 *
 * Weight slab rows for the same scope+serviceType+deliveryArea+rateType
 * are identified by their weightFrom/weightTo range.  The engine sorts them
 * ascending and picks the matching row dynamically — no hardcoded ranges.
 */
const freightRateSchema = new mongoose.Schema(
  {
    // ── Scope ────────────────────────────────────────────────────────────────
    // null = company default rate; ObjectId = account-specific rate
    billingAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingAccount',
      default: null,
      index: true,
    },

    // ── Rate dimensions ──────────────────────────────────────────────────────
    serviceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceType',
      required: true,
      index: true,
    },
    deliveryArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryArea',
      required: true,
      index: true,
    },

    // Matches RateType.code — stored as string for fast engine lookup
    // Allowed values mirror the six engines below
    rateType: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      enum: [
        'WEIGHT_SLAB',
        'PER_KG',
        'FLAT_RATE',
        'PER_PARCEL',
        'VOLUMETRIC',
        'PER_WAYBILL',
      ],
      index: true,
    },

    // ── Weight slab fields (only relevant for WEIGHT_SLAB) ───────────────────
    // weightFrom / weightTo define the slab range.
    // The last/open-ended slab has weightTo = null (∞).
    weightFrom: { type: Number, default: 0, min: 0 },
    weightTo:   { type: Number, default: null }, // null = open-ended (∞)

    // ── Rate values ──────────────────────────────────────────────────────────
    // WEIGHT_SLAB  → baseRate is the flat charge for this slab;
    //                additionalRatePerKg is charged per kg ABOVE weightFrom
    //                on the last/open-ended slab.
    // PER_KG       → baseRate = rate per kg
    // FLAT_RATE    → baseRate = flat charge
    // PER_PARCEL   → baseRate = rate per parcel
    // VOLUMETRIC   → baseRate = rate per chargeable kg
    // PER_WAYBILL  → baseRate = fixed charge per waybill
    baseRate:           { type: Number, required: true, default: 0, min: 0 },
    additionalRatePerKg: { type: Number, default: 0, min: 0 }, // open-ended slab only

    // ── Admin ────────────────────────────────────────────────────────────────
    effectiveDate: { type: Date, default: Date.now },
    expiryDate:    { type: Date, default: null },
    status:        { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes:         { type: String, trim: true },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ── Compound indexes for fast engine lookup ──────────────────────────────────
// Account-specific lookup
freightRateSchema.index({ billingAccount: 1, serviceType: 1, deliveryArea: 1, rateType: 1, status: 1 });
// Company default lookup (billingAccount = null)
freightRateSchema.index({ serviceType: 1, deliveryArea: 1, rateType: 1, status: 1 });
// Slab ordering
freightRateSchema.index({ deliveryArea: 1, rateType: 1, weightFrom: 1 });

export default mongoose.model('FreightRate', freightRateSchema);
