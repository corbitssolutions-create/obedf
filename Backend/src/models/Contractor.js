import mongoose from 'mongoose';

const contractorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contractor name is required'],
      unique: true,
      trim: true,
    },
    companyRegistration: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    serviceRegions: {
      type: [String],
      default: [],
    },
    vehicleTypes: {
      type: [String],
      default: [],
    },
    contractStartDate: {
      type: Date,
    },
    contractEndDate: {
      type: Date,
    },
    ratePerKm: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Contractor = mongoose.model('Contractor', contractorSchema);
export default Contractor;
