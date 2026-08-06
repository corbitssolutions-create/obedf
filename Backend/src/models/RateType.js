import mongoose from 'mongoose';
const rateTypeSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  unit:        { type: String, trim: true }, // e.g. Per KG, Per CBM, Flat Rate
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
rateTypeSchema.index({ code: 1 });
export default mongoose.model('RateType', rateTypeSchema);
