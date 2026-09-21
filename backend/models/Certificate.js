const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Certificate title is required'],
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  issuer: {
    type: String,
    required: [true, 'Issuer is required'],
  },
  issueDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
  },
  credentialId: {
    type: String,
    default: '',
  },
  credentialUrl: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['professional', 'academic', 'technical', 'compliance', 'other'],
    default: 'professional',
  },
  description: {
    type: String,
    default: '',
  },
  skills: [String],
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  fileUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'pending'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Certificate', certificateSchema);