/**
 * Recommendation Validators - Request validation for Phase 3B Enterprise Recommendation Engine endpoints.
 */
const { check, query, param, validationResult } = require('express-validator');

// Validation for getting recommendations
const validateGetRecommendations = [
  query('type')
    .optional()
    .isIn(['learning', 'skill', 'career', 'course', 'certification', 'job', 'enterprise', 'personalized'])
    .withMessage('Type must be one of: learning, skill, career, course, certification, job, enterprise, personalized'),
  query('category')
    .optional()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
  query('query')
    .optional()
    .isLength({ max: 10000 }).withMessage('Query must be less than 10000 characters'),
  query('sessionId')
    .optional()
    .isLength({ max: 200 }).withMessage('Session ID must be less than 200 characters'),
  query('useCache')
    .optional()
    .isBoolean().withMessage('useCache must be a boolean'),
];

// Validation for getting personalized recommendations
const validatePersonalized = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
  query('query')
    .optional()
    .isLength({ max: 10000 }).withMessage('Query must be less than 10000 characters'),
  query('sessionId')
    .optional()
    .isLength({ max: 200 }).withMessage('Session ID must be less than 200 characters'),
];

// Validation for submitting recommendation feedback
const validateFeedback = [
  check('recommendationId')
    .isMongoId().withMessage('Invalid recommendation ID'),
  check('type')
    .isIn(['like', 'dislike', 'ignore', 'saved', 'clicked'])
    .withMessage('Type must be one of: like, dislike, ignore, saved, clicked'),
  check('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  check('comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters'),
  check('source')
    .optional()
    .isIn(['api', 'assistant', 'dashboard', 'email', 'other'])
    .withMessage('Source must be one of: api, assistant, dashboard, email, other'),
];

// Validation for recommendation history query
const validateHistoryQuery = [
  query('type')
    .optional()
    .isIn(['learning', 'skill', 'career', 'course', 'certification', 'job', 'enterprise', 'personalized'])
    .withMessage('Type must be one of: learning, skill, career, course, certification, job, enterprise, personalized'),
  query('status')
    .optional()
    .isIn(['delivered', 'viewed', 'clicked', 'saved', 'dismissed'])
    .withMessage('Status must be one of: delivered, viewed, clicked, saved, dismissed'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
];

// Validation for similar content lookup
const validateSimilar = [
  check('query')
    .notEmpty().withMessage('Query is required')
    .isLength({ max: 10000 }).withMessage('Query must be less than 10000 characters'),
  check('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  check('type')
    .optional()
    .isIn(['learning', 'skill', 'career', 'course', 'certification', 'job', 'enterprise', 'personalized'])
    .withMessage('Type must be one of: learning, skill, career, course, certification, job, enterprise, personalized'),
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
  validateGetRecommendations,
  validatePersonalized,
  validateFeedback,
  validateHistoryQuery,
  validateSimilar,
  handleValidation,
};