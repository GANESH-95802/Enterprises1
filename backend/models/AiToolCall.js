const mongoose = require('mongoose');

/**
 * AI Tool Call
 * Records tool/function invocations made by the assistant engine.
 * Tracks execution results, status, and performance.
 */
const aiToolCallSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    default: 'default',
    index: true,
  },
  toolName: {
    type: String,
    required: true,
    index: true,
  },
  arguments: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true,
  },
  error: {
    type: String,
    default: '',
  },
  durationMs: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
aiToolCallSchema.index({ user: 1, createdAt: -1 });
aiToolCallSchema.index({ sessionId: 1, createdAt: -1 });
aiToolCallSchema.index({ toolName: 1, createdAt: -1 });

// TTL index for cleanup (90 days)
aiToolCallSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

module.exports = mongoose.model('AiToolCall', aiToolCallSchema);