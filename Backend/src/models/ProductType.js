import mongoose from 'mongoose';
const productTypeSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:          { type: String, required: true, trim: true },
  description:   { type: String, trim: true },
  hazardous:     { type: Boolean, default: false },
  requiresColdChain: { type: Boolean, default: false },
  status:        { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
productTypeSchema.index({ code: 1 });
export default mongoose.model('ProductType', productTypeSchema);
