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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    offerApplied:{
      type:Boolean,
      default:false,
    },
     offerDetails: {
      offerId:{
          type:mongoose.Schema.Types.ObjectId,
          ref:'Offer'
      },
      priceAfterOfferApplied: {
          type: Number,
          default: 0
      },
      offerPercentage: {
          type: Number,
          default: 0
      }
  }
  },
  { 
    timestamp: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
