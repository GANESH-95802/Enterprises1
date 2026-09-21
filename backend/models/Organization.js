const mongoose = require('mongoose');

/**
 * Organization
 * Enterprise organization entity for multi-tenant SaaS data isolation.
 * Each organization has users, settings, subscription, and usage limits.
 */
const organizationSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: 200,
    index: true,
  },
  industry: {
    type: String,
    default: '',
    trim: true,
    maxlength: 100,
    index: true,
  },
  logo: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000,
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'enterprise'],
    default: 'small',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      aiEnabled: true,
      knowledgeBaseEnabled: true,
      agentsEnabled: true,
      maxStorageMb: 1024,
      maxAgents: 10,
    },
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'professional', 'enterprise'],
    default: 'free',
    index: true,
  },
  usageLimits: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      aiRequestsPerMonth: 100,
      tokensPerMonth: 100000,
      storageMb: 1024,
      maxAgents: 3,
      maxUsers: 5,
      maxDocuments: 50,
    },
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for efficient organization queries
organizationSchema.index({ companyName: 1, createdAt: -1 });
organizationSchema.index({ industry: 1, isActive: 1 });
organizationSchema.index({ subscriptionPlan: 1, isActive: 1 });
organizationSchema.index({ owner: 1 });

module.exports = mongoose.model('Organization', organizationSchema);