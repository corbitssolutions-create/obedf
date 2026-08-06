import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  line1:      { type: String, trim: true },
  line2:      { type: String, trim: true },
  city:       { type: String, trim: true },
  province:   { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country:    { type: String, trim: true, default: 'South Africa' },
}, { _id: false });

const supplierSchema = new mongoose.Schema({
  supplierCode:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  supplierName:        { type: String, required: true, trim: true },
  supplierType:        { type: String, trim: true }, // Transporter, Fuel, Parts, etc.
  registrationNumber:  { type: String, trim: true },
  vatNumber:           { type: String, trim: true },
  contactPerson:       { type: String, trim: true },
  phoneNumber:         { type: String, trim: true },
  email:               { type: String, trim: true, lowercase: true },
  website:             { type: String, trim: true },
  physicalAddress:     { type: addressSchema },
  postalAddress:       { type: addressSchema },
  bankName:            { type: String, trim: true },
  bankAccountNumber:   { type: String, trim: true },
  bankBranchCode:      { type: String, trim: true },
  bankAccountType:     { type: String, trim: true },
  paymentTerm:         { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTerm' },
  currency:            { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  creditLimit:         { type: Number, default: 0 },
  notes:               { type: String, trim: true },
  status:              { type: String, enum: ['Active','Inactive','Blacklisted'], default: 'Active' },
  createdBy:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

supplierSchema.index({ supplierCode: 1 });
export default mongoose.model('Supplier', supplierSchema);
