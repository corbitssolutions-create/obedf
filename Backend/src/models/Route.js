import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  // Identification — no unique constraints, just required
  routeCode:         { type: String, required: true, trim: true, uppercase: true },
  name:              { type: String, required: true, trim: true },

  // Points
  startPoint:        { type: String, trim: true },
  destination:       { type: String, trim: true },
  origin:            { type: String, trim: true },

  // Linked masters
  originBranch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  destinationBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  zone:              { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },

  // Assigned driver (single)
  driver:            { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },

  // Assigned vehicle (single)
  vehicle:           { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

  // Assigned branches (multiple)
  branches:          { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }], default: [] },

  // Metrics
  distanceKm:        { type: Number, default: 0 },
  estimatedHours:    { type: Number, default: 0 },
  tollCost:          { type: Number, default: 0 },
  waypoints:         { type: [String], default: [] },

  status:            { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  notes:             { type: String, trim: true },
  createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Route', routeSchema);
