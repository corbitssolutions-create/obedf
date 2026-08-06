import mongoose from 'mongoose';
const failureReasonSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  requiresReschedule: { type: Boolean, default: false },
  requiresReturn:     { type: Boolean, default: false },
  status:      { type: String, enum: ['Active','Inactive'], default: 'Active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
failureReasonSchema.index({ code: 1 });
export default mongoose.model('FailureReason', failureReasonSchema);
