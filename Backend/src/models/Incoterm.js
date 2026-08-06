import mongoose from 'mongoose';

/**
 * Incoterms Master
 * Replaces all hardcoded incoterm lists throughout the application.
 * Admin-managed; only isActive records appear in Waybill dropdowns.
 */
const incotermSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true }, // e.g. EXW
  name:        { type: String, required: true, trim: true },                                 // e.g. Ex Works
  description: { type: String, trim: true },
  sortOrder:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

incotermSchema.index({ code: 1 });
incotermSchema.index({ sortOrder: 1, code: 1 });

export default mongoose.model('Incoterm', incotermSchema);
