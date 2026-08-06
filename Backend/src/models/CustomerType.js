import mongoose from 'mongoose';

const customerTypeSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status:      { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerTypeSchema.index({ code: 1 });

export default mongoose.model('CustomerType', customerTypeSchema);
