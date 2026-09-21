const mongoose = require('mongoose');

/**
 * Subscription
 * Manages organization subscription plans, billing status, and usage limits.
 */
const subscriptionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    unique: true,
    index: true,
  },
  plan: {
    type: String,
    enum: ['free', 'professional', 'enterprise'],
    default: 'free',
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'trialing', 'past_due', 'canceled', 'expired'],
    default: 'active',
    index: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    default: null,
  },
  trialEndsAt: {
    type: Date,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'pending', 'failed', 'refunded'],
    default: 'unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'bank', 'manual', 'none'],
    default: 'none',
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  price: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'USD',
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
  features: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      allAgents: false,
      customAgents: false,
      advancedAnalytics: false,
      prioritySupport: false,
      apiAccess: false,
      ssoEnabled: false,
    },
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  canceledAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for efficient subscription queries
subscriptionSchema.index({ plan: 1, status: 1 });
subscriptionSchema.index({ status: 1, expiryDate: 1 });
subscriptionSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);