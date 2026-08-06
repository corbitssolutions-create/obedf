import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    building:    { type: String, trim: true },
    street:      { type: String, trim: true },
    township:    { type: String, trim: true },
    suburb:      { type: String, trim: true },
    city:        { type: String, trim: true },
    province:    { type: String, trim: true },
    postalCode:  { type: String, trim: true },
    country:     { type: String, trim: true, default: 'South Africa' },
    countryCode: { type: String, trim: true, default: 'ZA' },
  },
  { _id: false }
);

const parcelSchema = new mongoose.Schema(
  {
    id:               { type: String, required: true, unique: true }, // e.g. WB000001-01
    weight:           { type: Number, default: 0 },
    length:           { type: Number, default: 0 },
    width:            { type: Number, default: 0 },
    height:           { type: Number, default: 0 },
    volumetricWeight: { type: Number, default: 0 },
  },
  { _id: false }
);

// Waybill-level extra charge — references ExtraCharge master, amount editable per waybill
const waybillExtraChargeSchema = new mongoose.Schema(
  {
    extraChargeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ExtraCharge' },
    chargeCode:     { type: String, trim: true },
    chargeName:     { type: String, trim: true },
    chargeType:     { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
    defaultAmount:  { type: Number, default: 0 },
    amount:         { type: Number, default: 0 }, // editable per-waybill value
  },
  { _id: true }
);

const waybillSchema = new mongoose.Schema(
  {
    waybillNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    productCode: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },

    // ── Branch determination (auto-assigned on create) ────────────────────────
    // AT Branch = logged-in user's branch (collection branch)
    atBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    // TO Branch = determined from receiver's postal code via PostalCode Master
    toBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },

    // ── Billing Account linkage ───────────────────────────────────────────────
    billingAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingAccount',
      default: null,
    },

    sender: {
      type: String,
      required: [true, 'Sender (Customer name) is required'],
      trim: true,
    },
    pickupPoint: {
      type: String,
      required: [true, 'Pickup point is required'],
      trim: true,
    },
    senderContact: { type: String, trim: true },
    senderEmail:   { type: String, trim: true },
    senderAddress: { type: String, trim: true },
    senderWechat:  { type: String, trim: true },

    // ── Billing contact (auto-populated from BillingAccount, editable) ────────
    billingContactPerson:  { type: String, trim: true },
    billingEmail:          { type: String, trim: true, lowercase: true },
    billingPhone:          { type: String, trim: true },

    // ── Payment (auto-populated, editable) ───────────────────────────────────
    paymentType:           { type: String, trim: true },
    paymentCollectionType: {
      type: String,
      enum: ['Cash on Delivery', 'Cash on Collection', ''],
      default: '',
      trim: true,
    },

    receiver: {
      type: String,
      required: [true, 'Receiver is required'],
      trim: true,
    },
    deliveryPoint:   { type: String, trim: true },
    receiverContact: { type: String, trim: true },
    receiverEmail:   { type: String, trim: true },
    receiverAddress: {
      type: addressSchema,
      required: [true, 'Receiver address is required'],
    },
    billingSameAsReceiver: {
      type: Boolean,
      default: true,
    },
    billingAddress: { type: addressSchema },

    receivingHours: {
      type: String,
      default: '08:00 - 16:00',
    },

    // ── Service / rate (auto-populated from BillingAccount defaults, editable) ─
    serviceType: { type: String, trim: true },
    rateType:    { type: String, trim: true },

    // ── Rating Engine output ──────────────────────────────────────────────────
    // Resolved at creation time from receiver postal code → PostalCode.deliveryArea
    deliveryArea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliveryArea',
      default: null,
    },
    // The FreightRate row that was used to calculate roadFreightTotal
    appliedFreightRate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreightRate',
      default: null,
    },
    // 'account' | 'company' | 'none' — which scope the rate came from
    rateSource: { type: String, trim: true, default: '' },
    // Transparent calculation detail stored for auditing / display
    rateBreakdown: { type: mongoose.Schema.Types.Mixed, default: null },

    charges:             { type: String, trim: true },
    specialInstructions: { type: String, trim: true },

    quantity: {
      type: Number,
      required: [true, 'Quantity (Parcel count) is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    parcels: [parcelSchema],

    // ── Extra charges (auto-populated from BillingAccount, editable) ──────────
    extraCharges: { type: [waybillExtraChargeSchema], default: [] },

    // ── Dynamic totals (recalculated on save) ─────────────────────────────────
    roadFreightTotal:   { type: Number, default: 0 },
    extraChargesTotal:  { type: Number, default: 0 },
    grandTotal:         { type: Number, default: 0 },

    status: {
      type: String,
      required: true,
      enum: ['Draft', 'Active', 'To Deliver', 'To Manifest', 'Cancelled', 'Delivered', 'Outstanding', 'Failed'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

const Waybill = mongoose.model('Waybill', waybillSchema);
export default Waybill;
