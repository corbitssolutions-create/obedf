import mongoose from 'mongoose';
const glAccountSchema = new mongoose.Schema({
  accountCode:  { type: String, required: true, unique: true, trim: true },
  accountName:  { type: String, required: true, trim: true },
  accountType:  { type: String, enum: ['Asset','Liability','Equity','Revenue','Expense'], required: true },
  description:  { type: String, trim: true },
  currency:     { type: mongoose.Schema.Types.ObjectId, ref: 'Currency' },
  isControlAccount: { type: Boolean, default: false },
  status:       { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
glAccountSchema.index({ accountCode: 1 });
export default mongoose.model('GlAccount', glAccountSchema);
