import mongoose from 'mongoose';

// Account-level extra charge: references the ExtraCharge master with an overrideable amount
const accountExtraChargeSchema = new mongoose.Schema({
  extraCharge: { type: mongoose.Schema.Types.ObjectId, ref: 'ExtraCharge', required: true },
  amount:      { type: Number, default: 0 },
  status:      { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { _id: true });

const billingAccountSchema = new mongoose.Schema({
  // Account identification
  billingAccountCode:     { type: String, required: true, unique: true, trim: true, uppercase: true },
  billingAccountName:     { type: String, required: true, trim: true },

  // Linked master records
  customer:               { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  branch:                 { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  currency:               { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  defaultRateCard:        { type: mongoose.Schema.Types.ObjectId, ref: 'RateCard' },

  // Financial terms
  creditLimit:            { type: Number, default: 0 },
  creditTerms:            { type: String, trim: true },
  paymentTerms:           { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerm' },
  billingCycle:           { type: String, enum: ['Daily','Weekly','Bi-Weekly','Monthly','On Delivery'], default: 'Monthly' },
  invoiceFrequency:       { type: String, enum: ['Per Waybill','Per Trip','Weekly','Monthly'], default: 'Monthly' },
  invoiceDeliveryMethod:  { type: String, enum: ['Email','Post','Portal','Manual'], default: 'Email' },
  vatNumber:              { type: String, trim: true },

  // Contact
  contactPerson:          { type: String, trim: true },
  email:                  { type: String, trim: true, lowercase: true },
  telephone:              { type: String, trim: true },

  // ── Sender Information (auto-populates Waybill Sender section) ────────────
  senderName:             { type: String, trim: true },
  senderContactPerson:    { type: String, trim: true },
  senderPhone:            { type: String, trim: true },
  senderEmail:            { type: String, trim: true, lowercase: true },
  senderAddress: {
    building:   { type: String, trim: true },
    street:     { type: String, trim: true },
    suburb:     { type: String, trim: true },
    city:       { type: String, trim: true },
    province:   { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country:    { type: String, trim: true, default: 'South Africa' },
  },

  // Billing contact (auto-populates on Waybill)
  billingContactPerson:   { type: String, trim: true },
  billingEmail:           { type: String, trim: true, lowercase: true },
  billingPhone:           { type: String, trim: true },

  // Default Waybill configuration
  defaultRateType:        { type: mongoose.Schema.Types.ObjectId, ref: 'RateType' },
  defaultServiceType:     { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceType' },
  defaultPaymentType:     { type: String, trim: true },
  paymentCollectionType:  {
    type: String,
    enum: ['Cash on Delivery', 'Cash on Collection', ''],
    default: '',
    trim: true,
  },

  // Account-level extra charges (references ExtraCharge master)
  extraCharges:           { type: [accountExtraChargeSchema], default: [] },

  // Billing address
  billingAddressLine1:    { type: String, trim: true },
  billingAddressLine2:    { type: String, trim: true },
  city:                   { type: String, trim: true },
  province:               { type: String, trim: true },
  postalCode:             { type: String, trim: true },
  country:                { type: String, trim: true, default: 'South Africa' },

  // Validity
  effectiveDate:          { type: Date },
  expiryDate:             { type: Date },
  accountStatus:          { type: String, enum: ['Active','Inactive','Suspended','Closed'], default: 'Active' },

  notes:                  { type: String, trim: true },
  createdBy:              { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

billingAccountSchema.index({ billingAccountCode: 1 });
billingAccountSchema.index({ customer: 1 });
export default mongoose.model('BillingAccount', billingAccountSchema);
