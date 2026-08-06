import mongoose from 'mongoose';

const podSchema = new mongoose.Schema(
  {
    waybill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Waybill',
      required: [true, 'Waybill reference is required'],
      index: true,
    },
    waybillNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    manifest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manifest',
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
    },
    driverName: {
      type: String,
      trim: true,
    },
    receiverName: {
      type: String,
      required: [true, 'Receiver name is required'],
      trim: true,
    },
    receiverSignature: {
      type: String, // base64 or file path
      trim: true,
    },
    deliveryDate: {
      type: Date,
      default: Date.now,
    },
    deliveryTime: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    photoProof: {
      type: String, // file path or URL
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Captured', 'Verified', 'Disputed'],
      default: 'Pending',
    },
    capturedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const POD = mongoose.model('POD', podSchema);
export default POD;
