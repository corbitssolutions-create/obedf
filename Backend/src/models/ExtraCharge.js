import mongoose from 'mongoose';

/**
 * ExtraCharge Master
 *
 * isDefault = true  → auto-loaded into every new Waybill
 * isActive  = true  → visible in dropdowns and available for selection
 * chargeType Fixed   → amount is a fixed ZAR value
 * chargeType Percentage → amount is applied as % of road-freight total
 */
const extraChargeSchema = new mongoose.Schema({
  chargeCode:    { type: String, required: true, unique: true, trim: true, uppercase: true },
  chargeName:    { type: String, required: true, trim: true },
  description:   { type: String, trim: true },
  chargeType:    { type: String, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
  defaultAmount: { type: Number, default: 0 },
  sortOrder:     { type: Number, default: 0 },
  isDefault:     { type: Boolean, default: false }, // auto-add to every new Waybill
  isActive:      { type: Boolean, default: true  }, // visible in dropdowns
  // legacy field kept for backward compat with company/account charge refs
  status:        { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  currency:      { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

extraChargeSchema.index({ chargeCode: 1 });
extraChargeSchema.index({ isDefault: 1, isActive: 1 });
extraChargeSchema.index({ sortOrder: 1, chargeName: 1 });

// Keep status in sync with isActive for backward compat
extraChargeSchema.pre('save', function (next) {
  this.status = this.isActive ? 'Active' : 'Inactive';
  next();
});

export default mongoose.model('ExtraCharge', extraChargeSchema);
