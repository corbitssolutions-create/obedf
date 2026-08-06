import mongoose from 'mongoose';

const manifestSchema = new mongoose.Schema(
  {
    manifestNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    driver: {
      type: String,
      required: [true, 'Driver is required'],
      trim: true,
    },
    vehicle: {
      type: String,
      required: [true, 'Vehicle is required'],
      trim: true,
    },
    route: {
      type: String,
      required: [true, 'Route is required'],
      trim: true,
    },
    subcontractor: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Open', 'On Delivery', 'Delivered', 'Cancelled'],
      default: 'Open',
    },
    waybills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Waybill',
      },
    ],
    totalParcels: {
      type: Number,
      default: 0,
    },
    totalWeight: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Manifest = mongoose.model('Manifest', manifestSchema);
export default Manifest;
