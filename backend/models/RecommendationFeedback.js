const mongoose = require('mongoose');

/**
 * RecommendationFeedback
 * Stores user feedback events for the Enterprise Recommendation Engine (Phase 3B).
 * Each record represents a single feedback action on a recommendation.
 * Feedback types: like, dislike, ignore, saved, clicked.
 * Used by the Feedback Manager and Ranking Engine to adjust future scores.
 */
const recommendationFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recommendation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recommendation',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['like', 'dislike', 'ignore', 'saved', 'clicked'],
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 0,
  },
  comment: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  source: {
    type: String,
    enum: ['api', 'assistant', 'dashboard', 'email', 'other'],
    default: 'api',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient feedback queries
recommendationFeedbackSchema.index({ recommendation: 1, type: 1 });
recommendationFeedbackSchema.index({ user: 1, type: 1, createdAt: -1 });
recommendationFeedbackSchema.index({ user: 1, recommendation: 1 }, { unique: true });

module.exports = mongoose.model('RecommendationFeedback', recommendationFeedbackSchema);