const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    otp: {
        type: Number,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '5m' // Example: OTP expires after 5 minutes
    }
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
