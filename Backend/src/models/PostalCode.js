import mongoose from 'mongoose';
const postalCodeSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, trim: true },
  suburb:     { type: String, trim: true },
  city:       { type: String, trim: true },
  province:   { type: String, trim: true },
  country:    { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  zone:       { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  // Determines the TO Branch for any waybill delivered to this postal code
  branchCode:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch',       default: null },
  // Determines the Delivery Area for rating engine lookup
  deliveryArea: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryArea', default: null },
  status:     { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
postalCodeSchema.index({ code: 1 });
postalCodeSchema.index({ branchCode: 1 });
postalCodeSchema.index({ deliveryArea: 1 });
export default mongoose.model('PostalCode', postalCodeSchema);
