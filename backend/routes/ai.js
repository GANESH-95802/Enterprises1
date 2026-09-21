const express = require('express');
const router = express.Router();
const {
  predictSales,
  generateDocument,
  explainMedical,
  analyzeImage,
  evaluateSkill,
  getRecommendations,
} = require('../controllers/aiController');
const {
  processQuery,
  getHistory,
  getContext,
  submitFeedback,
  clearHistory,
} = require('../controllers/aiInfraController');
const { protect } = require('../middleware/auth');
const { validateQuery, validateFeedback, handleValidation } = require('../validators/ai');
const {
  safetyFilter,
  auditLogger,
  costTracker,
  contextLoader,
  cacheCheck,
} = require('../services/ai/middleware');

// Protect all AI routes
router.use(protect);

// Apply AI-specific middleware to infrastructure routes
router.use('/query', safetyFilter, auditLogger, costTracker, cacheCheck);
router.use('/history', auditLogger);
router.use('/context', auditLogger);
router.use('/feedback', auditLogger);

// ─── AI Infrastructure Endpoints (Phase 1) ─────────────────────────────
router.post('/query', contextLoader, validateQuery, handleValidation, processQuery);
router.get('/history', getHistory);
router.get('/context', contextLoader, getContext);
router.post('/feedback', validateFeedback, handleValidation, submitFeedback);
router.delete('/history', clearHistory);

// ─── Existing AI Endpoints (Preserved) ─────────────────────────────────
router.post('/predict-sales', predictSales);
router.post('/generate-document', generateDocument);
router.post('/explain-medical', explainMedical);
router.post('/analyze-image', analyzeImage);
router.post('/evaluate-skill', evaluateSkill);
router.post('/recommendations', getRecommendations);

module.exports = router;