import mongoose from 'mongoose';

const creditDebitNoteSchema = new mongoose.Schema({
  noteNo:      { type: String, required: true, unique: true, trim: true },
  type:        { type: String, enum: ['Credit', 'Debit'], required: true },
  customer:    { type: String, required: true, trim: true },
  invoiceRef:  { type: String, default: '', trim: true },
  date:        { type: String, required: true },
  amount:      { type: Number, required: true, default: 0 },
  status:      {
    type: String,
    enum: ['Applied', 'Pending', 'Draft', 'Cancelled'],
    default: 'Draft',
  },
  reason:      {
    type: String,
    enum: [
      'Pricing Adjustment',
      'Damaged Goods',
      'Returned Goods',
      'Quantity Adjustment',
      'Freight Adjustment',
      'Other',
    ],
    default: 'Other',
  },
  description: { type: String, default: '' },
  branch:      { type: String, default: 'Head Office' },
  createdBy:   { type: String, default: 'Admin User' },
  appliedDate: { type: String, default: '' },
}, { timestamps: true });

creditDebitNoteSchema.index({ customer: 1 });
creditDebitNoteSchema.index({ type: 1 });
creditDebitNoteSchema.index({ status: 1 });

export default mongoose.model('CreditDebitNote', creditDebitNoteSchema);
