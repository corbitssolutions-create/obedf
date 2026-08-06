import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  code: { type: String, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  manager: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { _id: true });

const costCentreSchema = new mongoose.Schema({
  code: { type: String, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { _id: true });

const businessUnitSchema = new mongoose.Schema({
  code: { type: String, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { _id: true });

// Company-level extra charge: references the ExtraCharge master with an overrideable amount
const companyExtraChargeSchema = new mongoose.Schema({
  extraCharge: { type: mongoose.Schema.Types.ObjectId, ref: 'ExtraCharge', required: true },
  amount:      { type: Number, default: 0 },
  status:      { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { _id: true });

const companySchema = new mongoose.Schema({
  companyName:          { type: String, required: true, trim: true },
  tradingName:          { type: String, trim: true },
  registrationNumber:   { type: String, trim: true, unique: true, sparse: true },
  vatNumber:            { type: String, trim: true },
  taxNumber:            { type: String, trim: true },
  logo:                 { type: String, trim: true },
  website:              { type: String, trim: true },

  // Contact
  email:                { type: String, trim: true, lowercase: true },
  phoneNumber:          { type: String, trim: true },
  faxNumber:            { type: String, trim: true },

  // Address
  physicalAddress: {
    building:   { type: String, trim: true },
    street:     { type: String, trim: true },
    suburb:     { type: String, trim: true },
    city:       { type: String, trim: true },
    province:   { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country:    { type: String, trim: true, default: 'South Africa' },
  },
  postalAddress: {
    building:   { type: String, trim: true },
    street:     { type: String, trim: true },
    suburb:     { type: String, trim: true },
    city:       { type: String, trim: true },
    province:   { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country:    { type: String, trim: true, default: 'South Africa' },
  },

  // Financial
  currency:             { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  financialYearEnd:     { type: String, trim: true },

  // Org structure
  branches:             { type: [mongoose.Schema.Types.ObjectId], ref: 'Branch', default: [] },
  departments:          { type: [departmentSchema],    default: [] },
  costCentres:          { type: [costCentreSchema],    default: [] },
  businessUnits:        { type: [businessUnitSchema],  default: [] },

  // System
  defaultBranch:        { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  timeZone:             { type: String, trim: true, default: 'Africa/Johannesburg' },
  status:               { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Company-level Waybill defaults ────────────────────────────────────────
  defaultRateType:             { type: mongoose.Schema.Types.ObjectId, ref: 'RateType' },
  defaultServiceType:          { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceType' },
  defaultPaymentType:          { type: String, trim: true },
  defaultPaymentCollectionType: {
    type: String,
    enum: ['Cash on Delivery', 'Cash on Collection', ''],
    default: '',
  },

  // ── Company-level extra charges (fallback when account has none) ───────────
  companyExtraCharges: { type: [companyExtraChargeSchema], default: [] },

}, { timestamps: true });

export default mongoose.model('Company', companySchema);
