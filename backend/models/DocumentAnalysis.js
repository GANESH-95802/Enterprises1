const mongoose = require('mongoose');

/**
 * DocumentAnalysis
 * Stores document intelligence analysis results (Phase 3C).
 * Each record represents a single document analysis with classification,
 * extraction, summary, OCR, comparison, and metadata results.
 */
const documentAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'txt', 'markdown', 'md', 'text', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'],
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
    enum: ['uploaded', 'processing', 'analyzed', 'failed'],
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
  storagePath: {
    type: String,
    default: '',
  },
  checksum: {
    type: String,
    default: '',
    index: true,
  },
  classification: {
    type: {
      type: String,
      enum: [
        'resume', 'invoice', 'form', 'contract', 'report',
        'email', 'letter', 'presentation', 'spreadsheet',
        'legal', 'technical', 'financial', 'marketing',
        'medical', 'academic', 'general',
      ],
      default: 'general',
    },
    confidence: { type: Number, default: 0 },
    category: { type: String, default: '' },
    subcategory: { type: String, default: '' },
    labels: { type: [String], default: [] },
    method: { type: String, default: '' },
  },
  summary: {
    text: { type: String, default: '' },
    keyPoints: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral',
    },
    sentimentScore: { type: Number, default: 0.5 },
    length: { type: Number, default: 0 },
    method: { type: String, default: '' },
  },
  extraction: {
    entities: { type: mongoose.Schema.Types.Mixed, default: {} },
    structuredData: { type: mongoose.Schema.Types.Mixed, default: {} },
    tables: [{
      title: { type: String, default: '' },
      headers: { type: [String], default: [] },
      rows: { type: [[String]], default: [] },
      confidence: { type: Number, default: 0 },
    }],
    fields: { type: mongoose.Schema.Types.Mixed, default: {} },
    formData: { type: mongoose.Schema.Types.Mixed, default: {} },
    confidence: { type: Number, default: 0 },
    method: { type: String, default: '' },
  },
  ocr: {
    text: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    pages: { type: Number, default: 0 },
    language: { type: String, default: 'en' },
    processingTimeMs: { type: Number, default: 0 },
    method: { type: String, default: '' },
  },
  metadata: {
    author: { type: String, default: '' },
    title: { type: String, default: '' },
    subject: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    creator: { type: String, default: '' },
    producer: { type: String, default: '' },
    pageCount: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    characterCount: { type: Number, default: 0 },
    language: { type: String, default: '' },
    createdAt: { type: Date, default: null },
    modifiedAt: { type: Date, default: null },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  analysis: {
    textLength: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    paragraphCount: { type: Number, default: 0 },
    sentenceCount: { type: Number, default: 0 },
    averageWordLength: { type: Number, default: 0 },
    readingTimeMinutes: { type: Number, default: 0 },
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'complex'],
      default: 'moderate',
    },
    readabilityScore: { type: Number, default: 0 },
    languageConfidence: { type: Number, default: 0 },
    topics: { type: [String], default: [] },
  },
  comparison: {
    similarDocuments: [{
      documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentAnalysis' },
      fileName: { type: String, default: '' },
      similarity: { type: Number, default: 0 },
      commonSections: { type: [String], default: [] },
      differences: { type: [String], default: [] },
    }],
    comparedAt: { type: Date, default: null },
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

// Indexes for efficient document intelligence queries
documentAnalysisSchema.index({ user: 1, status: 1, createdAt: -1 });
documentAnalysisSchema.index({ user: 1, category: 1, createdAt: -1 });
documentAnalysisSchema.index({ user: 1, 'classification.type': 1, createdAt: -1 });
documentAnalysisSchema.index({ user: 1, fileType: 1, createdAt: -1 });
documentAnalysisSchema.index({ user: 1, checksum: 1 });
documentAnalysisSchema.index({ 'comparison.similarDocuments.documentId': 1 });

module.exports = mongoose.model('DocumentAnalysis', documentAnalysisSchema);