const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  otp: String,
  otpExpiresAt: Date,
  email: { type: String, unique: true, sparse: true },
  name: String,
  googleId: String,
  photo: String
});

module.exports = mongoose.model('User', userSchema);
