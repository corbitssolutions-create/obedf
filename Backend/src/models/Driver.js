import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  // System user link (optional)
  userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

  // Identification
  employeeId:        { type: String, unique: true, sparse: true, trim: true },
  fullName:          { type: String, required: true, trim: true },
  idNumber:          { type: String, trim: true, unique: true, sparse: true },

  // License
  licenseNumber:     { type: String, required: true, unique: true, trim: true },
  licenseType:       { type: String, trim: true }, // Code 8, Code 10, Code 14
  licenseExpiry:     { type: Date },
  prdpNumber:        { type: String, trim: true },
  prdpExpiry:        { type: Date },

  // Contact
  phoneNumber:       { type: String, trim: true },
  email:             { type: String, trim: true, lowercase: true },
  address:           { type: String, trim: true },

  // Emergency contact
  emergencyContact: {
    name:     { type: String, trim: true },
    phone:    { type: String, trim: true },
    relation: { type: String, trim: true },
  },

  // Organisation
  branch:            { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // primary branch (legacy)
  branches:          { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }], default: [] }, // multiple branch assignment
  driverGroup:       { type: String, trim: true },

  // Assignment
  status:            { type: String, enum: ['Available', 'On Trip', 'Offline', 'Suspended'], default: 'Available' },
  currentVehicle:    { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

  // Compliance
  medicalExpiry:     { type: Date },
  trainingExpiry:    { type: Date },

  notes:             { type: String, trim: true },
  createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

driverSchema.index({ licenseNumber: 1 });
driverSchema.index({ employeeId: 1 });

export default mongoose.model('Driver', driverSchema);
