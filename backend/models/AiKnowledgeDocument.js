const mongoose = require('mongoose');

/**
 * AiKnowledgeDocument
 * Stores metadata for documents ingested into the Enterprise Knowledge Base.
 * Actual content is chunked and stored as AiEmbedding records (source: 'document').
 */
const aiKnowledgeDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt', 'markdown', 'md', 'text'],
    required: true,
    index: true,
  },
  mimeType: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'indexed', 'failed'],
    default: 'uploaded',
    index: true,
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
  summary: {
    type: String,
    default: '',
  },
  chunkCount: {
    type: Number,
    default: 0,
  },
  embeddingCount: {
    type: Number,
    default: 0,
  },
  storagePath: {
    type: String,
    default: '',
  },
  checksum: {
    type: String,
    default: '',
    index: true,
  },
  error: {
    type: String,
    default: '',
  },
  processingTimeMs: {
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

// Indexes for efficient knowledge base queries
aiKnowledgeDocumentSchema.index({ user: 1, status: 1, createdAt: -1 });
aiKnowledgeDocumentSchema.index({ user: 1, category: 1, status: 1 });
aiKnowledgeDocumentSchema.index({ user: 1, title: 1 });

module.exports = mongoose.model('AiKnowledgeDocument', aiKnowledgeDocumentSchema);