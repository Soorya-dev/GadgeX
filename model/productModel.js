const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      // required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      // required: true,
      min: 0,
    },
    image: {
      type: [String],
    },
    category: {
      type: String,
      // required: true,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    isListed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
