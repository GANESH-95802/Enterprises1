const { check, validationResult } = require('express-validator');

// Validation for AI query submission
const validateQuery = [
  check('query')
    .notEmpty()
    .withMessage('Query is required')
    .isLength({ max: 10000 })
    .withMessage('Query must be less than 10000 characters'),
];

// Validation for feedback submission
const validateFeedback = [
  check('messageId')
    .notEmpty()
    .withMessage('Message ID is required'),
  check('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  check('feedback')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Feedback must be less than 2000 characters'),
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
  validateQuery,
  validateFeedback,
  handleValidation,
};