import mongoose from 'mongoose';
const vehicleTypeSchema = new mongoose.Schema({
  code:           { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:           { type: String, required: true, trim: true },
  description:    { type: String, trim: true },
  maxCapacityKg:  { type: Number, default: 0 },
  maxVolumeCbm:   { type: Number, default: 0 },
  status:         { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
vehicleTypeSchema.index({ code: 1 });
export default mongoose.model('VehicleType', vehicleTypeSchema);
