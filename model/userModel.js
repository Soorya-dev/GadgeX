// model/userModel.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

// Add this method to your schema
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);


