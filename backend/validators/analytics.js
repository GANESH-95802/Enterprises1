/**
 * Analytics Validators - Request validation for Phase 4 ML & AI Analytics endpoints.
 */
const { check, query, param, validationResult } = require('express-validator');

// Event types valid for tracking
const EVENT_TYPES = [
  'user_action', 'ai_request', 'ai_response', 'recommendation_view',
  'recommendation_click', 'recommendation_feedback', 'conversation_start',
  'conversation_message', 'conversation_end', 'document_upload',
  'document_analyze', 'document_compare', 'search_query', 'feature_use',
  'error', 'session_start', 'session_end',
];

// Categories valid for tracking
const CATEGORIES = ['user', 'ai', 'recommendation', 'conversation', 'document', 'search', 'system'];

// Validation for tracking an event
const validateTrackEvent = [
  check('eventType')
    .isIn(EVENT_TYPES)
    .withMessage(`Event type must be one of: ${EVENT_TYPES.join(', ')}`),
  check('category')
    .isIn(CATEGORIES)
    .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  check('action')
    .optional()
    .isLength({ max: 100 }).withMessage('Action must be less than 100 characters'),
  check('resource')
    .optional()
    .isLength({ max: 200 }).withMessage('Resource must be less than 200 characters'),
  check('sessionId')
    .optional()
    .isLength({ max: 200 }).withMessage('Session ID must be less than 200 characters'),
  check('duration')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
  check('success')
    .optional()
    .isBoolean().withMessage('Success must be a boolean'),
];

// Validation for tracking multiple events
const validateTrackEvents = [
  check('events')
    .isArray({ min: 1, max: 500 }).withMessage('Events must be an array of 1-500 events'),
  check('events.*.eventType')
    .isIn(EVENT_TYPES)
    .withMessage('Each event must have a valid eventType'),
  check('events.*.category')
    .isIn(CATEGORIES)
    .withMessage('Each event must have a valid category'),
];

// Validation for user behavior analytics
const validateUserBehavior = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID'),
  query('eventType')
    .optional()
    .isIn(EVENT_TYPES)
    .withMessage('Invalid event type'),
  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage('Invalid category'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO date'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

// Validation for AI usage analytics
const validateAIUsage = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO date'),
];

// Validation for AI performance metrics
const validateAIPerformance = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO date'),
];

// Validation for recommendation analytics
const validateRecommendationAnalytics = [
  query('userId')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO date'),
];

// Validation for conversation insights
const validateConversationInsights = [
  query('userId')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO date'),
];

// Validation for trends
const validateTrends = [
  query('eventType')
    .optional()
    .isIn(EVENT_TYPES)
    .withMessage('Invalid event type'),
  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage('Invalid category'),
  query('granularity')
    .optional()
    .isIn(['hour', 'day'])
    .withMessage('Granularity must be hour or day'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO date'),
];

// Validation for insights generation
const validateGenerateInsights = [
  query('userId')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO date'),
];

// Validation for predictions
const validatePredict = [
  query('eventType')
    .optional()
    .isIn(EVENT_TYPES)
    .withMessage('Invalid event type'),
  query('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage('Invalid category'),
  query('horizon')
    .optional()
    .isInt({ min: 1, max: 30 }).withMessage('Horizon must be between 1 and 30'),
  query('granularity')
    .optional()
    .isIn(['hour', 'day'])
    .withMessage('Granularity must be hour or day'),
  query('days')
    .optional()
    .isInt({ min: 5, max: 90 }).withMessage('Days must be between 5 and 90'),
];

// Validation for user engagement prediction
const validatePredictUserEngagement = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID'),
  query('horizon')
    .optional()
    .isInt({ min: 1, max: 30 }).withMessage('Horizon must be between 1 and 30'),
];

// Validation for ML feature extraction
const validateExtractFeatures = [
  query('userId')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90'),
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
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
};