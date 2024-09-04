const mongoose = require("mongoose");

const cartModel = new mongoose.Schema({ 
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    product: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            
          
            quantity: {
                type:Number,
                default: 0
            },
          
        }
    ],
    oldTotal: {
        type: Number,
        default: 0
    },
    subtotal: {
        type: Number,
       
    },
    discount: {
        type:Number,
        default:0
    }
})

module.exports = mongoose.model("Cart", cartModel)