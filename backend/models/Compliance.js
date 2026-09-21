const mongoose = require('mongoose');

const complianceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Compliance title is required'],
    trim: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  type: {
    type: String,
    enum: ['regulation', 'license', 'certification', 'audit', 'policy', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['compliant', 'non-compliant', 'pending', 'expired', 'in-progress'],
    default: 'pending',
  },
  description: {
    type: String,
    default: '',
  },
  issuedDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  authority: {
    type: String,
    default: '',
  },
  documentUrl: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Compliance', complianceSchema);