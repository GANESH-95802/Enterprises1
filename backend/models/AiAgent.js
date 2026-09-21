const mongoose = require('mongoose');

/**
 * AiAgent
 * AI Agent registry entry — defines an agent's capabilities, configuration,
 * permissions, and operational status within an organization.
 */
const aiAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Agent name is required'],
    trim: true,
    maxlength: 100,
    index: true,
  },
  type: {
    type: String,
    required: [true, 'Agent type is required'],
    enum: ['business', 'compliance', 'hr', 'customer-support', 'custom'],
    index: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused', 'error'],
    default: 'active',
    index: true,
  },
  version: {
    type: String,
    default: '1.0.0',
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      provider: 'auto',
      model: '',
      temperature: 0.7,
      maxTokens: 2048,
      useKnowledge: true,
      knowledgeLimit: 3,
      tools: [],
      capabilities: [],
    },
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      roles: ['admin', 'manager', 'user'],
      dataAccess: ['own-organization'],
      canReadDocuments: true,
      canQueryKnowledge: true,
      canRunReports: false,
    },
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      totalRuns: 0,
      totalTokens: 0,
      totalErrors: 0,
      avgLatencyMs: 0,
      lastRunAt: null,
    },
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isSystem: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for efficient agent queries
aiAgentSchema.index({ type: 1, status: 1 });
aiAgentSchema.index({ organizationId: 1, createdAt: -1 });
aiAgentSchema.index({ createdBy: 1 });
aiAgentSchema.index({ name: 1, type: 1 });

module.exports = mongoose.model('AiAgent', aiAgentSchema);