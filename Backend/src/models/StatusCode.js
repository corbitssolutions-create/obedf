import mongoose from 'mongoose';
const statusCodeSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  module:      { type: String, trim: true }, // e.g. Waybill, Manifest, Trip
  colour:      { type: String, trim: true, default: '#6B7280' },
  isFinal:     { type: Boolean, default: false },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
statusCodeSchema.index({ code: 1 });
export default mongoose.model('StatusCode', statusCodeSchema);
