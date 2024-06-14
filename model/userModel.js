// model/userModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name:                { type: String, required: true },
  
  email:               { type: String, required: true, unique: true },
  password:            { type: String, required: true },
  mobile:              { type: String, required: true },
  is_admin:            { type: Boolean, default: false },
  isVerified:          { type: Boolean, default: false },
  isBlocked:           { type: Boolean, default: false },
  resetPasswordToken:  { type: String },
  resetPasswordExpires:{ type: Date },
});


module.exports = mongoose.model("User", userSchema);


