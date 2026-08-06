import mongoose from 'mongoose';
const documentTemplateSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  documentType:{ type: String, enum: ['Waybill','Manifest','POD','Invoice','Credit Note','Delivery Note'], required: true },
  headerHtml:  { type: String, trim: true },
  bodyHtml:    { type: String, trim: true },
  footerHtml:  { type: String, trim: true },
  paperSize:   { type: String, enum: ['A4','A5','Letter','Label'], default: 'A4' },
  orientation: { type: String, enum: ['Portrait','Landscape'], default: 'Portrait' },
  isDefault:   { type: Boolean, default: false },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
documentTemplateSchema.index({ code: 1 });
export default mongoose.model('DocumentTemplate', documentTemplateSchema);
