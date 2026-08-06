import mongoose from 'mongoose';
const countrySchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, trim: true, uppercase: true }, // ZA, US
  name:         { type: String, required: true, trim: true },
  dialingCode:  { type: String, trim: true },
  currency:     { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  status:       { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
countrySchema.index({ code: 1 });
export default mongoose.model('Country', countrySchema);
