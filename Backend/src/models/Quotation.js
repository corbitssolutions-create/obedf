import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  qty:         { type: Number, required: true, default: 1 },
  rate:        { type: Number, required: true, default: 0 },
  taxPct:      { type: Number, default: 15 },
  discount:    { type: Number, default: 0 },
  amount:      { type: Number, default: 0 },
}, { _id: true });

const quotationSchema = new mongoose.Schema({
  quoteNo:         { type: String, required: true, unique: true, trim: true },
  customer:        { type: String, required: true, trim: true },
  customerAddress: { type: String, default: '' },
  customerContact: { type: String, default: '' },
  customerEmail:   { type: String, default: '' },
  route:           { type: String, default: '' },
  issueDate:       { type: String, required: true },
  validUntil:      { type: String, required: true },
  rate:            { type: Number, required: true, default: 0 }, // Grand total
  subtotal:        { type: Number, default: 0 },
  taxTotal:        { type: Number, default: 0 },
  discount:        { type: Number, default: 0 },
  status:          {
    type: String,
    enum: ['Draft', 'Pending', 'Approved', 'Rejected', 'Expired'],
    default: 'Draft',
  },
  branch:          { type: String, default: 'Head Office' },
  createdBy:       { type: String, default: 'Admin User' },
  lineItems:       { type: [quotationItemSchema], default: [] },
  notes:           { type: String, default: '' },
}, { timestamps: true });

quotationSchema.index({ customer: 1 });
quotationSchema.index({ status: 1 });

export default mongoose.model('Quotation', quotationSchema);
