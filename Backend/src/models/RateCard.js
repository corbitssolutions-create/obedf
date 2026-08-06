import mongoose from 'mongoose';
const rateCardSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:          { type: String, required: true, trim: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  origin:        { type: String, required: true, trim: true },
  destination:   { type: String, required: true, trim: true },
  serviceType:   { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceType', required: true },
  rateType:      { type: mongoose.Schema.Types.ObjectId, ref: 'RateType', required: true },
  currency:      { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  price:         { type: Number, required: true, default: 0 },
  fuelLevy:      { type: Number, default: 0 },
  tollCharges:   { type: Number, default: 0 },
  minimumCharge: { type: Number, default: 0 },
  effectiveDate: { type: Date, required: true },
  expiryDate:    { type: Date },
  status:        { type: String, enum: ['Active','Inactive','Expired'], default: 'Active' },
  notes:         { type: String, trim: true },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
rateCardSchema.index({ code: 1 });
rateCardSchema.index({ customer: 1 });
export default mongoose.model('RateCard', rateCardSchema);
