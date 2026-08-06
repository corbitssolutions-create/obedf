import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    items: [
      {
        description: String,
        quantity: Number,
        weight: Number,
      },
    ],
    status: {
      type: String,
      enum: ['Received', 'Processed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Received',
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
