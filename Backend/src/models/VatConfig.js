import mongoose from 'mongoose';
const vatConfigSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:          { type: String, required: true, trim: true }, // Standard Rate, Zero Rated, Exempt
  rate:          { type: Number, required: true, default: 0 }, // e.g. 15
  glAccount:     { type: mongoose.Schema.Types.ObjectId, ref: 'GlAccount' },
  effectiveDate: { type: Date },
  status:        { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
vatConfigSchema.index({ code: 1 });
export default mongoose.model('VatConfig', vatConfigSchema);
