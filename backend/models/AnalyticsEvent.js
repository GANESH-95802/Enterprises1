const mongoose = require('mongoose');

/**
 * AnalyticsEvent
 * Stores user behavior, AI usage, recommendation, and conversation analytics events (Phase 4).
 * Each record represents a single analytics event captured by the Metrics Collector.
 */
const analyticsEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  eventType: {
    type: String,
    enum: [
      'user_action', 'ai_request', 'ai_response', 'recommendation_view',
      'recommendation_click', 'recommendation_feedback', 'conversation_start',
      'conversation_message', 'conversation_end', 'document_upload',
      'document_analyze', 'document_compare', 'search_query', 'feature_use',
      'error', 'session_start', 'session_end',
    ],
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['user', 'ai', 'recommendation', 'conversation', 'document', 'search', 'system'],
    required: true,
    index: true,
  },
  action: {
    type: String,
    default: '',
    index: true,
  },
  resource: {
    type: String,
    default: '',
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  sessionId: {
    type: String,
    default: '',
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  duration: {
    type: Number,
    default: 0,
  },
  success: {
    type: Boolean,
    default: true,
  },
  error: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient analytics queries
analyticsEventSchema.index({ user: 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ user: 1, category: 1, timestamp: -1 });
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ category: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: 1 });
analyticsEventSchema.index({ timestamp: -1 });
analyticsEventSchema.index({ user: 1, action: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);