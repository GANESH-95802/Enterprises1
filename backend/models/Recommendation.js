const mongoose = require('mongoose');

/**
 * Recommendation
 * Tracks recommendation history and impressions for the Enterprise Recommendation Engine (Phase 3B).
 * Each record represents a single recommendation delivered to a user.
 */
const recommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'learning',
      'skill',
      'career',
      'course',
      'certification',
      'job',
      'enterprise',
      'personalized',
    ],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  description: {
    type: String,
    default: '',
    maxlength: 5000,
  },
  source: {
    type: String,
    enum: [
      'profile',
      'skill',
      'certificate',
      'business',
      'product',
      'customer',
      'knowledge',
      'conversation',
      'course',
      'job',
      'enterprise',
      'assistant',
      'other',
    ],
    default: 'other',
    index: true,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  category: {
    type: String,
    default: 'general',
    index: true,
  },
  tags: {
    type: [String],
    default: [],
    index: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  scoreBreakdown: {
    similarity: { type: Number, default: 0 },
    preference: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    freshness: { type: Number, default: 0 },
    feedback: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  context: {
    sessionId: { type: String, default: '' },
    query: { type: String, default: '' },
    sourceType: { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['delivered', 'viewed', 'clicked', 'saved', 'dismissed'],
    default: 'delivered',
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient recommendation queries
recommendationSchema.index({ user: 1, type: 1, createdAt: -1 });
recommendationSchema.index({ user: 1, category: 1, createdAt: -1 });
recommendationSchema.index({ user: 1, status: 1, createdAt: -1 });
recommendationSchema.index({ user: 1, score: -1 });
recommendationSchema.index({ user: 1, source: 1, sourceId: 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);