const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['sales', 'financial', 'compliance', 'project', 'healthcare', 'analytics', 'custom'],
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  summary: {
    type: String,
    default: '',
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  aiInsights: {
    type: String,
    default: '',
  },
  dateRange: {
    start: { type: Date },
    end: { type: Date },
  },
  format: {
    type: String,
    enum: ['pdf', 'csv', 'json', 'html'],
    default: 'json',
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating',
  },
  fileUrl: {
    type: String,
    default: '',
  },
  tags: [String],
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Report', reportSchema);