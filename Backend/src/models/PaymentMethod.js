import mongoose from 'mongoose';
const paymentMethodSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true }, // EFT, Cash, Credit Card
  description: { type: String, trim: true },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
paymentMethodSchema.index({ code: 1 });
export default mongoose.model('PaymentMethod', paymentMethodSchema);
