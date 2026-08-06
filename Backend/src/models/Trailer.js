import mongoose from 'mongoose';

const trailerSchema = new mongoose.Schema({
  trailerCode:          { type: String, required: true, unique: true, trim: true, uppercase: true },
  registrationNumber:   { type: String, required: true, unique: true, trim: true, uppercase: true },
  fleetNumber:          { type: String, trim: true, unique: true, sparse: true },
  trailerType:          { type: String, trim: true }, // Flatbed, Curtainsider, Refrigerated, etc.
  make:                 { type: String, trim: true },
  model:                { type: String, trim: true },
  year:                 { type: Number },
  capacityKg:           { type: Number, default: 0 },
  volumeCapacityCbm:    { type: Number, default: 0 },
  tareWeightKg:         { type: Number, default: 0 },
  gvm:                  { type: Number, default: 0 },
  length:               { type: Number, default: 0 },
  width:                { type: Number, default: 0 },
  height:               { type: Number, default: 0 },
  colour:               { type: String, trim: true },
  vinNumber:            { type: String, trim: true, unique: true, sparse: true },
  licenseDiscExpiry:    { type: Date },
  roadworthyExpiry:     { type: Date },
  insuranceExpiry:      { type: Date },
  branch:               { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  branches:             { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }], default: [] },
  currentVehicle:       { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  status:               { type: String, enum: ['Active','In Maintenance','Breakdown','Inactive'], default: 'Active' },
  notes:                { type: String, trim: true },
  createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

trailerSchema.index({ trailerCode: 1 });
trailerSchema.index({ registrationNumber: 1 });
export default mongoose.model('Trailer', trailerSchema);
