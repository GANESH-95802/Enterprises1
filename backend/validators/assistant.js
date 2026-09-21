/**
 * Assistant Validators - Request validation for assistant engine endpoints.
 */
const { check, validationResult } = require('express-validator');

const validateChatMessage = [
  check('message')
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 10000 }).withMessage('Message must be less than 10000 characters'),
  check('profile')
    .optional()
    .isIn(['business', 'education', 'healthcare', 'general'])
    .withMessage('Profile must be one of: business, education, healthcare, general'),
  check('provider')
    .optional()
    .isIn(['gemini', 'openai', 'auto'])
    .withMessage('Provider must be one of: gemini, openai, auto'),
  check('temperature')
    .optional()
    .isFloat({ min: 0, max: 2 })
    .withMessage('Temperature must be between 0 and 2'),
  check('maxTokens')
    .optional()
    .isInt({ min: 100, max: 8000 })
    .withMessage('Max tokens must be between 100 and 8000'),
  check('useKnowledge')
    .optional()
    .isBoolean()
    .withMessage('useKnowledge must be a boolean'),
  check('knowledgeLimit')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Knowledge limit must be between 1 and 10'),
  check('knowledgeCategory')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Knowledge category must be less than 100 characters'),
  check('knowledgeMinScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Knowledge minimum score must be between 0 and 1'),
];

const validateSessionUpdate = [
  check('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
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
  validateChatMessage,
  validateSessionUpdate,
  handleValidation,
};