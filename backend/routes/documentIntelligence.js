/**
 * Document Intelligence Routes (Phase 3C — Document Intelligence)
 * API endpoints for document upload, analysis, extraction, summarization, comparison, and management.
 */
const express = require('express');
const router = express.Router();
const {
  uploadAndAnalyze,
  analyzeDocument,
  extractInformation,
  summarizeDocument,
  compareDocuments,
  findSimilarDocuments,
  getDocumentIntelligence,
  listDocuments,
  deleteDocument,
  getStats,
  getCapabilities,
} = require('../controllers/documentIntelligenceController');
const { protect } = require('../middleware/auth');
const {
  validateUploadAndAnalyze,
  validateAnalyzeDocument,
  validateExtractInformation,
  validateSummarizeDocument,
  validateCompareDocuments,
  validateFindSimilar,
  validateListDocuments,
  validateDocumentId,
  handleValidation,
} = require('../validators/documentIntelligence');
const {
  uploadDocument,
  handleDocumentUploadError,
} = require('../middleware/documentUpload');
const {
  safetyFilter,
  auditLogger,
  costTracker,
  aiRateLimiter,
} = require('../services/ai/middleware');

// Protect all document intelligence routes
router.use(protect);

// Apply AI middleware to compute-heavy endpoints
router.use('/upload', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/compare', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/documents/:analysisId/similar', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/documents/:analysisId/summarize', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/documents/:analysisId/extract', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/documents', auditLogger);
router.use('/stats', auditLogger);

// ─── Document Intelligence Endpoints (Phase 3C) ─────────────────────────

// Upload and analyze a document
router.post(
  '/upload',
  uploadDocument.single('file'),
  handleDocumentUploadError,
  validateUploadAndAnalyze,
  handleValidation,
  uploadAndAnalyze
);

// Analyze an existing document
router.post(
  '/documents/:analysisId/analyze',
  validateAnalyzeDocument,
  handleValidation,
  analyzeDocument
);

// Extract structured information from a document
router.post(
  '/documents/:analysisId/extract',
  validateExtractInformation,
  handleValidation,
  extractInformation
);

// Summarize a document
router.post(
  '/documents/:analysisId/summarize',
  validateSummarizeDocument,
  handleValidation,
  summarizeDocument
);

// Compare two documents
router.post(
  '/compare',
  validateCompareDocuments,
  handleValidation,
  compareDocuments
);

// Find similar documents
router.get(
  '/documents/:analysisId/similar',
  validateFindSimilar,
  handleValidation,
  findSimilarDocuments
);

// Get document intelligence results
router.get(
  '/documents/:analysisId',
  validateDocumentId,
  handleValidation,
  getDocumentIntelligence
);

// List analyzed documents
router.get(
  '/documents',
  validateListDocuments,
  handleValidation,
  listDocuments
);

// Delete a document analysis
router.delete(
  '/documents/:analysisId',
  validateDocumentId,
  handleValidation,
  deleteDocument
);

// Get document intelligence engine statistics
router.get('/stats', getStats);

// Get document intelligence capabilities
router.get('/capabilities', getCapabilities);

module.exports = router;