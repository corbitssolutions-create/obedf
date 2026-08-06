import mongoose from 'mongoose';
const currencySchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, trim: true, uppercase: true }, // ZAR, USD
  name:         { type: String, required: true, trim: true },
  symbol:       { type: String, required: true, trim: true }, // R, $
  decimalPlaces:{ type: Number, default: 2 },
  isBase:       { type: Boolean, default: false }, // system base currency
  status:       { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
currencySchema.index({ code: 1 });
export default mongoose.model('Currency', currencySchema);
