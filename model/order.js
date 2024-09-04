const mongoose = require("mongoose");

const orderModel = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  addressId: {
    type: mongoose.Types.ObjectId,
    ref: 'Address',
    required: true,
  },
  paymentMethod: {
    type: String,
  },
  product: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
  },
  Date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  returnStatus: {
    type: String,
    enum: ['Not Requested', 'Pending', 'Approved', 'Rejected'],
    default: 'Not Requested',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending',
    required: true,
  },
},
  { timestamps: true });

module.exports = mongoose.model("Order", orderModel);
