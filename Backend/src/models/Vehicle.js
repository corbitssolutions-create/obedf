import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  // Identification
  vehicleCode:          { type: String, required: false, unique: true, sparse: true, trim: true, uppercase: true },
  registrationNumber:   { type: String, required: true, unique: true, trim: true, uppercase: true },
  fleetNumber:          { type: String, trim: true, unique: true, sparse: true },

  // Specs — stored as free text OR ObjectId ref (flexible for when master tables are empty)
  vehicleType:          { type: mongoose.Schema.Types.Mixed, ref: 'VehicleType' },
  fuelType:             { type: mongoose.Schema.Types.Mixed, ref: 'FuelType' },

  // Physical details
  make:                 { type: String, trim: true },
  model:                { type: String, trim: true },
  year:                 { type: Number },
  colour:               { type: String, trim: true },
  vinNumber:            { type: String, trim: true, unique: true, sparse: true },

  // Capacity
  capacityKg:           { type: Number, default: 0 },
  volumeCapacityCbm:    { type: Number, default: 0 },
  tareWeightKg:         { type: Number, default: 0 },
  gvm:                  { type: Number, default: 0 }, // Gross Vehicle Mass

  // Compliance
  licenseDiscExpiry:    { type: Date },
  roadworthyExpiry:     { type: Date },
  insuranceExpiry:      { type: Date },
  serviceNextDate:      { type: Date },
  serviceNextKm:        { type: Number, default: 0 },
  currentOdometer:      { type: Number, default: 0 },

  // Organisation
  branch:               { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },   // primary (legacy)
  branches:             { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }], default: [] }, // multiple

  // Assignment
  status:               { type: String, enum: ['Active', 'In Maintenance', 'Breakdown', 'Inactive'], default: 'Active' },
  currentDriver:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },

  notes:                { type: String, trim: true },
  createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

vehicleSchema.index({ vehicleCode: 1 });
vehicleSchema.index({ registrationNumber: 1 });

export default mongoose.model('Vehicle', vehicleSchema);
