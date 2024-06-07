// const { ObjectId } = require('mongodb');
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
      name: {
        type: String,
        required: true,
      },
    
      quantity: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
      price: {
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
});



module.exports = mongoose.model("Order", orderModel);