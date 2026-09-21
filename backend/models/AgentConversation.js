const mongoose = require('mongoose');
/**
 * AgentConversation
 * Stores multi-turn conversations between users and AI Agents.
 * Tracks messages, context, and agent-specific metadata.
 */
const agentConversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiAgent',
    required: true,
    index: true,
  },
  agentType: {
    type: String,
    enum: ['business', 'compliance', 'hr', 'customer-support', 'custom'],
    default: 'custom',
    index: true,
  },
  title: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200,
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'agent', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
  }],
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'completed'],
    default: 'active',
    index: true,
  },
  sessionId: {
    type: String,
    default: '',
  },
  source: {
    type: String,
    enum: ['web', 'api', 'mobile', 'integration'],
    default: 'web',
  },
}, {
  timestamps: true,
});

// Indexes for efficient conversation queries
agentConversationSchema.index({ user: 1, agentId: 1, updatedAt: -1 });
agentConversationSchema.index({ user: 1, status: 1, createdAt: -1 });
agentConversationSchema.index({ agentId: 1, createdAt: -1 });
agentConversationSchema.index({ sessionId: 1 });

module.exports = mongoose.model('AgentConversation', agentConversationSchema);