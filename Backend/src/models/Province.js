import mongoose from 'mongoose';
const provinceSchema = new mongoose.Schema({
  code:     { type: String, required: true, trim: true, uppercase: true },
  name:     { type: String, required: true, trim: true },
  country:  { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  status:   { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
provinceSchema.index({ code: 1, country: 1 }, { unique: true });
export default mongoose.model('Province', provinceSchema);
