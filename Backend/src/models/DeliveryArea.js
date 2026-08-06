import mongoose from 'mongoose';

/**
 * DeliveryArea
 *
 * A named commercial pricing zone (e.g. "Sandton", "Pretoria CBD").
 * Postal codes are linked back to a DeliveryArea via the postalCode.deliveryArea field
 * that we add to the PostalCode model.  The Rating Engine looks up the DeliveryArea
 * from the waybill's receiver postal code to select the correct rate row.
 */
const deliveryAreaSchema = new mongoose.Schema(
  {
    code:        { type: String, required: true, unique: true, trim: true, uppercase: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Optional: link to a branch that services this area
    branch:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },

    // Optional: list of postal codes that fall in this area (informational reference)
    // The canonical mapping lives on PostalCode.deliveryArea to avoid duplication.
    status:      { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

deliveryAreaSchema.index({ code: 1 });
deliveryAreaSchema.index({ name: 1 });

export default mongoose.model('DeliveryArea', deliveryAreaSchema);
