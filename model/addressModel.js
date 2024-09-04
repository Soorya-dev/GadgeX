const mongoose = require('mongoose')
// const User = require('../model/userModel')



var addressModel = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique:true,
        // index:true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    mobile: {
        type: Number,
    },
    houseName: {
        type: String,
    },
    street: {
        type: String,
    },
    landmark: {
        type: String,
    },
    pincode: {
        type: Number,
    },
    city: {
        type: String,
    },
    state: {
        type: String,
    },
    default: {
        type: Boolean,
        default: false,
    }

}, { timestamps: true });


module.exports = mongoose.model('Address', addressModel)