const mongoose = require('mongoose');

/**
 * UsageTracking
 * Tracks AI usage, API calls, tokens, and storage per organization.
 * Enables usage limits, billing, and analytics.
 */
const usageTrackingSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  period: {
    type: String,
    required: true,
    index: true,
  },
  aiRequests: {
    type: Number,
    default: 0,
  },
  apiCalls: {
    type: Number,
    default: 0,
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  tokensByProvider: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      gemini: 0,
      openai: 0,
      fallback: 0,
    },
  },
  storageBytes: {
    type: Number,
    default: 0,
  },
  documentsUploaded: {
    type: Number,
    default: 0,
  },
  agentsRun: {
    type: Number,
    default: 0,
  },
  agentsByType: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  costEstimate: {
    type: Number,
    default: 0,
  },
  activeUsers: {
    type: Number,
    default: 0,
  },
  userActivity: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  featureUsage: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  warnings: [{
    type: {
      type: String,
      enum: ['limit', 'warning', 'critical'],
      default: 'warning',
    },
    message: {
      type: String,
      default: '',
    },
    threshold: {
      type: Number,
      default: 0,
    },
    current: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

// Unique: one usage record per organization per period
usageTrackingSchema.index({ organizationId: 1, period: 1 }, { unique: true });
usageTrackingSchema.index({ period: 1, organizationId: 1 });
usageTrackingSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('UsageTracking', usageTrackingSchema);