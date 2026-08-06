import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema(
  {
    shipmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    waybills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Waybill',
      },
    ],
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    route: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Draft', 'Ready', 'In Transit', 'Completed', 'Cancelled'],
      default: 'Draft',
    },
  },
  {
    timestamps: true,
  }
);

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;
