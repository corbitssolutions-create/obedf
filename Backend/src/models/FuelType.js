import mongoose from 'mongoose';
const fuelTypeSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  unitPrice:   { type: Number, default: 0 },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
fuelTypeSchema.index({ code: 1 });
export default mongoose.model('FuelType', fuelTypeSchema);
