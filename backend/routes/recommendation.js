/**
 * Recommendation Routes (Phase 3B — Enterprise Recommendation Engine)
 * API endpoints for recommendations, personalization, feedback, history, statistics, and similar content.
 */
const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getPersonalizedRecommendations,
  submitFeedback,
  getRecommendationHistory,
  getRecommendationStats,
  findSimilar,
  getTypes,
  getEngineStats,
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');
const {
  validateGetRecommendations,
  validatePersonalized,
  validateFeedback,
  validateHistoryQuery,
  validateSimilar,
  handleValidation,
} = require('../validators/recommendation');
const {
  safetyFilter,
  auditLogger,
  costTracker,
  aiRateLimiter,
} = require('../services/ai/middleware');

// Protect all recommendation routes
router.use(protect);

// Apply AI middleware to compute-heavy endpoints
router.use('/personalized', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/similar', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/feedback', auditLogger);
router.use('/history', auditLogger);
router.use('/stats', auditLogger);

// ─── Recommendation Endpoints (Phase 3B) ───────────────────────────────

// Get recommendations (with optional type, category, query filtering)
router.get('/', validateGetRecommendations, handleValidation, getRecommendations);

// Get personalized recommendations
router.get('/personalized', validatePersonalized, handleValidation, getPersonalizedRecommendations);

// Submit recommendation feedback
router.post('/feedback', validateFeedback, handleValidation, submitFeedback);

// Get recommendation history
router.get('/history', validateHistoryQuery, handleValidation, getRecommendationHistory);

// Get recommendation statistics
router.get('/stats', getRecommendationStats);

// Find similar content
router.post('/similar', validateSimilar, handleValidation, findSimilar);

// Get available recommendation types
router.get('/types', getTypes);

// Get recommendation engine statistics
router.get('/engine-stats', getEngineStats);

module.exports = router;