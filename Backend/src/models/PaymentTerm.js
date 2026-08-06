import mongoose from 'mongoose';
const paymentTermSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true }, // Net 30, COD, EOM
  days:        { type: Number, default: 0 },
  description: { type: String, trim: true },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
paymentTermSchema.index({ code: 1 });
export default mongoose.model('PaymentTerm', paymentTermSchema);
