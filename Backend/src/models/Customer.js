import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  line1:      { type: String, trim: true },
  line2:      { type: String, trim: true },
  city:       { type: String, trim: true },
  province:   { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country:    { type: String, trim: true, default: 'South Africa' },
}, { _id: false });

const contactPersonSchema = new mongoose.Schema({
  name:       { type: String, trim: true },
  title:      { type: String, trim: true },
  email:      { type: String, trim: true, lowercase: true },
  phone:      { type: String, trim: true },
  mobile:     { type: String, trim: true },
  isPrimary:  { type: Boolean, default: false },
  department: { type: String, trim: true },
}, { _id: true });

const customerSchema = new mongoose.Schema({
  // Identification
  customerCode:      { type: String, required: false, unique: true, sparse: true, trim: true, uppercase: true },
  name:              { type: String, required: true, unique: true, trim: true },
  customerType:      { type: String, trim: true, default: 'Corporate' }, // free text — loaded from CustomerType master

  // Contact
  contactPersons:    { type: [contactPersonSchema], default: [] },
  email:             { type: String, trim: true, lowercase: true },
  phone:             { type: String, trim: true },
  wechat:            { type: String, trim: true },

  // Addresses
  billingAddress:    { type: addressSchema },
  deliveryAddress:   { type: addressSchema },

  // Legacy flat field (for backward compat with existing waybills)
  address:           { type: String, trim: true },

  // Pickup points (multi-value)
  pickupPoints:      { type: [String], default: [] },

  // Financial
  vatNumber:         { type: String, trim: true },
  creditLimit:       { type: Number, default: 0 },
  creditTerms:       { type: String, trim: true },
  currency:          { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  paymentTerm:       { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerm' },

  // Classification
  customerGroup:     { type: String, trim: true },
  branch:            { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },

  // Status
  status:            { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },

  createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerSchema.index({ customerCode: 1 });
customerSchema.index({ name: 1 });

export default mongoose.model('Customer', customerSchema);
