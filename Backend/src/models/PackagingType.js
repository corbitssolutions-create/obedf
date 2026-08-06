import mongoose from 'mongoose';
const packagingTypeSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
packagingTypeSchema.index({ code: 1 });
export default mongoose.model('PackagingType', packagingTypeSchema);
