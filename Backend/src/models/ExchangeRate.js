import mongoose from 'mongoose';
const exchangeRateSchema = new mongoose.Schema({
  fromCurrency:  { type: mongoose.Schema.Types.ObjectId, ref: 'Currency', required: true },
  toCurrency:    { type: mongoose.Schema.Types.ObjectId, ref: 'Currency', required: true },
  rate:          { type: Number, required: true },
  effectiveDate: { type: Date, required: true },
  expiryDate:    { type: Date },
  source:        { type: String, trim: true }, // Manual, SARB, etc.
  status:        { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
export default mongoose.model('ExchangeRate', exchangeRateSchema);
