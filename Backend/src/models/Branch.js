import mongoose from 'mongoose';

const operatingHoursSchema = new mongoose.Schema({
  day:     { type: String, trim: true }, // Monday, Tuesday...
  opens:   { type: String, trim: true }, // 08:00
  closes:  { type: String, trim: true }, // 17:00
  closed:  { type: Boolean, default: false },
}, { _id: false });

const branchSchema = new mongoose.Schema({
  // Identification
  code:            { type: String, required: true, unique: true, trim: true, uppercase: true },
  name:            { type: String, required: true, unique: true, trim: true },

  // Address
  address:         { type: String, trim: true },
  addressLine1:    { type: String, trim: true },
  addressLine2:    { type: String, trim: true },
  city:            { type: String, trim: true },
  province:        { type: String, trim: true },
  postalCode:      { type: String, trim: true },
  country:         { type: String, trim: true, default: 'South Africa' },

  // Contact
  phoneNumber:     { type: String, trim: true },
  email:           { type: String, trim: true, lowercase: true },
  faxNumber:       { type: String, trim: true },

  // Management
  managerName:     { type: String, trim: true },
  managerEmail:    { type: String, trim: true, lowercase: true },
  managerPhone:    { type: String, trim: true },

  // Operating hours
  operatingHours:  { type: [operatingHoursSchema], default: [] },

  // System flags
  isHeadOffice:    { type: Boolean, default: false },
  status:          { type: String, enum: ['Active', 'Inactive'], default: 'Active' },

  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

branchSchema.index({ code: 1 });
branchSchema.index({ name: 1 });

export default mongoose.model('Branch', branchSchema);
