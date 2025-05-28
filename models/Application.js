const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visaType: { type: String, enum: ['work', 'study'] },
  photo: { type: String },
  aadhar: { type: String },
  passport: { type: String },
  father: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  status: { type: String, enum: ['pending', 'under review', 'approved', 'rejected'], default: 'pending' },
  notes: String,
  approvedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);