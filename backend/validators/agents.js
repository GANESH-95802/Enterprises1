/**
 * AI Agent Validators - Request validation for Phase 7 AI Agent endpoints.
 */
const { check, query, validationResult } = require('express-validator');

// Validation for creating a new agent
const validateCreateAgent = [
  check('name')
    .notEmpty().withMessage('Agent name is required')
    .isLength({ max: 100 }).withMessage('Agent name must be less than 100 characters'),
  check('type')
    .notEmpty().withMessage('Agent type is required')
    .isIn(['business', 'compliance', 'hr', 'customer-support', 'custom'])
    .withMessage('Agent type must be one of: business, compliance, hr, customer-support, custom'),
  check('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  check('configuration')
    .optional()
    .isObject().withMessage('Configuration must be an object'),
  check('permissions')
    .optional()
    .isObject().withMessage('Permissions must be an object'),
];

// Validation for running an agent
const validateRunAgent = [
  check('message')
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 10000 }).withMessage('Message must be less than 10000 characters'),
  check('sessionId')
    .optional()
    .isLength({ max: 200 }).withMessage('Session ID must be less than 200 characters'),
];

// Validation for updating an agent
const validateUpdateAgent = [
  check('name')
    .optional()
    .isLength({ max: 100 }).withMessage('Agent name must be less than 100 characters'),
  check('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  check('status')
    .optional()
    .isIn(['active', 'inactive', 'paused', 'error'])
    .withMessage('Status must be one of: active, inactive, paused, error'),
  check('configuration')
    .optional()
    .isObject().withMessage('Configuration must be an object'),
  check('permissions')
    .optional()
    .isObject().withMessage('Permissions must be an object'),
];

// Validation for agent ID param
const validateAgentId = [
  check('agentId')
    .isMongoId().withMessage('Invalid agent ID'),
];

// Validation for conversation ID param
const validateConversationId = [
  check('conversationId')
    .isMongoId().withMessage('Invalid conversation ID'),
];

// Validation for list query params
const validateListAgentsQuery = [
  query('type')
    .optional()
    .isIn(['business', 'compliance', 'hr', 'customer-support', 'custom'])
    .withMessage('Type must be a valid agent type'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'paused', 'error'])
    .withMessage('Status must be one of: active, inactive, paused, error'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

// Validation for conversation list query
const validateListConversationsQuery = [
  query('agentId')
    .optional()
    .isMongoId().withMessage('Invalid agent ID'),
  query('status')
    .optional()
    .isIn(['active', 'archived', 'completed'])
    .withMessage('Status must be one of: active, archived, completed'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
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
  validateCreateAgent,
  validateRunAgent,
  validateUpdateAgent,
  validateAgentId,
  validateConversationId,
  validateListAgentsQuery,
  validateListConversationsQuery,
  handleValidation,
};