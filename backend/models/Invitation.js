const mongoose = require('mongoose');

/**
 * Invitation
 * Manages team member invitations for organizations.
 */
const invitationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member', 'viewer'],
    default: 'member',
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending',
    index: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient invitation queries
invitationSchema.index({ organizationId: 1, status: 1 });
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ token: 1, status: 1 });

module.exports = mongoose.model('Invitation', invitationSchema);