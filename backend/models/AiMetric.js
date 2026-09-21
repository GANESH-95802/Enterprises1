const mongoose = require('mongoose');

/**
 * AiMetric
 * Stores aggregated AI performance metrics and analytics data points (Phase 4).
 * Each record represents a metric snapshot at a point in time.
 */
const aiMetricSchema = new mongoose.Schema({
  metricType: {
    type: String,
    enum: [
      'ai_usage', 'ai_latency', 'ai_cost', 'ai_quality', 'ai_errors',
      'user_behavior', 'recommendation_performance', 'conversation_stats',
      'document_analytics', 'search_analytics', 'system_health',
    ],
    required: true,
    index: true,
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    required: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  dimensions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  counts: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  averages: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  totals: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient metric queries
aiMetricSchema.index({ metricType: 1, period: 1, startTime: -1 });
aiMetricSchema.index({ metricType: 1, startTime: -1 });
aiMetricSchema.index({ period: 1, startTime: -1 });
aiMetricSchema.index({ 'dimensions.userId': 1, metricType: 1, startTime: -1 });

module.exports = mongoose.model('AiMetric', aiMetricSchema);