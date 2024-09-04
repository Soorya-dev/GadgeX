const mongoose = require('mongoose');

const offerSchema = mongoose.Schema({
    type:{
        type:String,
        required:true
    },
    name: {
        type: String,
        required: true
    },
    offerUsed: [
        {
            categoryId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            },
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            }
        }
    ],
    expireDate: {
        type: Date,
        required: true
    },
    timeStamp: {
        type: Date,
        default: Date.now
    },
    percentage: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Offer', offerSchema);