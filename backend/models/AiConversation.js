const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system'],
  },
  content: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    default: 'default',
    index: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  provider: {
    type: String,
    enum: ['gemini', 'openai', 'mock', 'unknown'],
    default: 'unknown',
  },
  model: {
    type: String,
    default: '',
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },
  feedback: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
aiConversationSchema.index({ user: 1, sessionId: 1, createdAt: -1 });
aiConversationSchema.index({ user: 1, createdAt: -1 });
aiConversationSchema.index({ sessionId: 1, createdAt: -1 });
aiConversationSchema.index({ user: 1, role: 1 });
aiConversationSchema.index({ content: 'text' });

// Add TTL index for conversation retention (90 days by default)
aiConversationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }
);

module.exports = mongoose.model('AiConversation', aiConversationSchema);