const mongoose = require('mongoose');

/**
 * AI Conversation Session
 * Tracks metadata and lifecycle of an assistant conversation session.
 * Each session is tied to a user and an assistant profile.
 */
const aiConversationSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  profile: {
    type: String,
    enum: ['business', 'education', 'healthcare', 'general'],
    default: 'general',
    index: true,
  },
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: 200,
  },
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true,
  },
  settings: {
    provider: {
      type: String,
      enum: ['gemini', 'openai', 'auto'],
      default: 'auto',
    },
    model: {
      type: String,
      default: '',
    },
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7,
    },
    maxTokens: {
      type: Number,
      min: 100,
      max: 8000,
      default: 1500,
    },
    stream: {
      type: Boolean,
      default: false,
    },
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
aiConversationSessionSchema.index({ user: 1, status: 1, lastMessageAt: -1 });
aiConversationSessionSchema.index({ user: 1, profile: 1 });

// TTL index for session cleanup (180 days by default)
aiConversationSessionSchema.index(
  { lastMessageAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 }
);

module.exports = mongoose.model('AiConversationSession', aiConversationSessionSchema);