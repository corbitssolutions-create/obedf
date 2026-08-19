import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  qty:         { type: Number, required: true, default: 1 },
  rate:        { type: Number, required: true, default: 0 },
  taxPct:      { type: Number, default: 15 },
  amount:      { type: Number, default: 0 },
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  amount:        { type: Number, required: true },
  paymentDate:   { type: Date, default: Date.now },
  paymentMethod: { type: String, default: 'EFT' },
  reference:     { type: String, trim: true },
  notes:         { type: String, trim: true },
  recordedBy:    { type: String, trim: true },
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  invoiceNo:       { type: String, required: true, unique: true, trim: true },
  customer:        { type: String, required: true, trim: true },
  customerAddress: { type: String, default: '' },
  customerContact: { type: String, default: '' },
  customerEmail:   { type: String, default: '' },
  issueDate:       { type: String, required: true },
  dueDate:         { type: String, required: true },
  amount:          { type: Number, required: true, default: 0 }, // Grand total
  subtotal:        { type: Number, default: 0 },
  taxTotal:        { type: Number, default: 0 },
  balance:         { type: Number, required: true, default: 0 },
  status:          {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'],
    default: 'Draft',
  },
  branch:          { type: String, default: 'Head Office' },
  createdBy:       { type: String, default: 'Admin User' },
  paymentTerms:    { type: String, default: 'Net 14 Days' },
  lineItems:       { type: [lineItemSchema], default: [] },
  notes:           { type: String, default: '' },
  payments:        { type: [paymentSchema], default: [] },
}, { timestamps: true });

invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });

export default mongoose.model('Invoice', invoiceSchema);
