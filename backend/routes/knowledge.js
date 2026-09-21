/**
 * Knowledge Base Routes (Phase 3A — Enterprise RAG)
 * API endpoints for document ingestion, semantic search, retrieval, and knowledge base management.
 */
const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  searchKnowledge,
  retrieve,
  listDocuments,
  getDocument,
  getDocumentChunks,
  updateDocument,
  deleteDocument,
  getStats,
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/auth');
const {
  validateKnowledgeSearch,
  validateRetrieve,
  validateDocumentUpdate,
  validateListQuery,
  validateDocumentId,
  handleValidation,
} = require('../validators/knowledge');
const {
  uploadKnowledge,
  handleKnowledgeUploadError,
} = require('../middleware/knowledgeUpload');
const {
  safetyFilter,
  auditLogger,
  costTracker,
  aiRateLimiter,
} = require('../services/ai/middleware');

// Protect all knowledge base routes
router.use(protect);

// Apply AI middleware to search/retrieve endpoints
router.use('/search', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/retrieve', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/documents', auditLogger);
router.use('/stats', auditLogger);

// ─── Knowledge Base Endpoints (Phase 3A) ───────────────────────────────

// Document ingestion
router.post(
  '/documents',
  uploadKnowledge.single('file'),
  handleKnowledgeUploadError,
  uploadDocument
);

// Semantic search and retrieval
router.post('/search', validateKnowledgeSearch, handleValidation, searchKnowledge);
router.post('/retrieve', validateRetrieve, handleValidation, retrieve);

// Document management
router.get('/documents', validateListQuery, handleValidation, listDocuments);
router.get('/documents/:documentId', validateDocumentId, handleValidation, getDocument);
router.get('/documents/:documentId/chunks', validateDocumentId, handleValidation, getDocumentChunks);
router.patch('/documents/:documentId', validateDocumentId, validateDocumentUpdate, handleValidation, updateDocument);
router.delete('/documents/:documentId', validateDocumentId, handleValidation, deleteDocument);

// Knowledge base statistics
router.get('/stats', getStats);

module.exports = router;