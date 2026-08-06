import mongoose from 'mongoose';
const suburbSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  city:       { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  province:   { type: mongoose.Schema.Types.ObjectId, ref: 'Province', required: true },
  postalCode: { type: String, trim: true },
  status:     { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
suburbSchema.index({ name: 1, city: 1 });
export default mongoose.model('Suburb', suburbSchema);
