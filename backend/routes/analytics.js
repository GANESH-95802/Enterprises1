/**
 * Analytics Routes (Phase 4 — ML & AI Analytics)
 * API endpoints for user behavior, AI usage, recommendation analytics, conversation insights,
 * trend detection, predictions, and ML feature extraction.
 */
const express = require('express');
const router = express.Router();
const {
  trackEvent,
  trackEvents,
  getUserBehavior,
  getAIUsage,
  getAIPerformance,
  getRecommendationAnalytics,
  getConversationInsights,
  getTrends,
  generateInsights,
  predict,
  predictUserEngagement,
  extractFeatures,
  buildFeatureVectors,
  runAggregation,
  getStats,
  getCapabilities,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const {
  validateTrackEvent,
  validateTrackEvents,
  validateUserBehavior,
  validateAIUsage,
  validateAIPerformance,
  validateRecommendationAnalytics,
  validateConversationInsights,
  validateTrends,
  validateGenerateInsights,
  validatePredict,
  validatePredictUserEngagement,
  validateExtractFeatures,
  handleValidation,
} = require('../validators/analytics');
const {
  safetyFilter,
  auditLogger,
  costTracker,
  aiRateLimiter,
} = require('../services/ai/middleware');

// Protect all analytics routes
router.use(protect);

// Apply AI middleware to compute-heavy endpoints
router.use('/events', auditLogger, aiRateLimiter);
router.use('/insights', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/predictions', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/users/:userId/behavior', auditLogger, aiRateLimiter);
router.use('/users/:userId/predict', auditLogger, aiRateLimiter);
router.use('/ml', auditLogger);
router.use('/trends', auditLogger);
router.use('/aggregate', auditLogger);
router.use('/stats', auditLogger);

// ─── Analytics Endpoints (Phase 4) ────────────────────────────────────────

// Track events
router.post('/events', validateTrackEvent, handleValidation, trackEvent);
router.post('/events/batch', validateTrackEvents, handleValidation, trackEvents);

// Analytics queries
router.get('/users/:userId/behavior', validateUserBehavior, handleValidation, getUserBehavior);
router.get('/users/:userId/predict', validatePredictUserEngagement, handleValidation, predictUserEngagement);
router.get('/ai/usage', validateAIUsage, handleValidation, getAIUsage);
router.get('/ai/performance', validateAIPerformance, handleValidation, getAIPerformance);
router.get('/recommendations', validateRecommendationAnalytics, handleValidation, getRecommendationAnalytics);
router.get('/conversations', validateConversationInsights, handleValidation, getConversationInsights);
router.get('/trends', validateTrends, handleValidation, getTrends);
router.get('/insights', validateGenerateInsights, handleValidation, generateInsights);
router.get('/predictions', validatePredict, handleValidation, predict);

// ML service layer
router.get('/ml/features', validateExtractFeatures, handleValidation, extractFeatures);
router.get('/ml/feature-vectors', validateExtractFeatures, handleValidation, buildFeatureVectors);

// Aggregation & system
router.post('/aggregate', runAggregation);
router.get('/stats', getStats);
router.get('/capabilities', getCapabilities);

module.exports = router;