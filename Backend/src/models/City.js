import mongoose from 'mongoose';
const citySchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  province: { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  country:  { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  status:   { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
citySchema.index({ name: 1, province: 1 });
export default mongoose.model('City', citySchema);
