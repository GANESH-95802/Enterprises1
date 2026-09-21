const mongoose = require('mongoose');

const aiEmbeddingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  contentHash: {
    type: String,
    required: true,
    index: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  dimension: {
    type: Number,
    default: 384,
  },
  provider: {
    type: String,
    enum: ['openai', 'gemini', 'fallback', 'unknown'],
    default: 'unknown',
  },
  model: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  source: {
    type: String,
    enum: ['conversation', 'document', 'business', 'product', 'skill', 'other'],
    default: 'other',
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for efficient embedding queries
aiEmbeddingSchema.index({ user: 1, source: 1, createdAt: -1 });
aiEmbeddingSchema.index({ user: 1, contentHash: 1 }, { unique: true });
aiEmbeddingSchema.index({ dimension: 1 });
aiEmbeddingSchema.index({ provider: 1 });

module.exports = mongoose.model('AiEmbedding', aiEmbeddingSchema);