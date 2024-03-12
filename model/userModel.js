const mongoose=require("mongoose");

const userSchema=mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_admin:{
        type:Boolean,
        default:false
    },
    isVerified: {
        type: Boolean,
        default: false // Assuming users are initially not verified
    }

});

module.exports = mongoose.model('User',userSchema);