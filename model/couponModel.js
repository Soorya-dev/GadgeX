const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    couponCode: {
        type: String,
        required: true
    },
    minimumAmount: {
        type: Number,
        required: true
    },
    expired: {
        type: Date,
        required: true
    },
    usersList: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        couponUsed: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: { createdAt: 'createdAt' }
});

module.exports = mongoose.model('Coupon', couponSchema);

