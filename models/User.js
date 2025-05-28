const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  otp: { type: String, default: '' },
  isActive: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'officer', 'admin'], default: 'user' }
});

module.exports = mongoose.model('User', userSchema);