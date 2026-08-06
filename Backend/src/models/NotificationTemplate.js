import mongoose from 'mongoose';
const notificationTemplateSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  type:        { type: String, enum: ['SMS','Email','WhatsApp'], required: true },
  module:      { type: String, trim: true }, // Waybill, Manifest, POD, Invoice
  subject:     { type: String, trim: true }, // Email subject
  body:        { type: String, required: true }, // Template with placeholders {{waybillNo}}
  placeholders:{ type: [String], default: [] },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
notificationTemplateSchema.index({ code: 1 });
export default mongoose.model('NotificationTemplate', notificationTemplateSchema);
