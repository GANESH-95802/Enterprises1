/**
 * Knowledge Base Validators - Request validation for Phase 3A Enterprise RAG endpoints.
 */
const { check, query, validationResult } = require('express-validator');

// Validation for knowledge base search
const validateKnowledgeSearch = [
  check('query')
    .notEmpty().withMessage('Query is required')
    .isLength({ max: 10000 }).withMessage('Query must be less than 10000 characters'),
  check('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  check('category')
    .optional()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
  check('minScore')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Min score must be between 0 and 1'),
  check('documentId')
    .optional()
    .isMongoId().withMessage('Invalid document ID'),
];

// Validation for RAG retrieval
const validateRetrieve = [
  check('query')
    .notEmpty().withMessage('Query is required')
    .isLength({ max: 10000 }).withMessage('Query must be less than 10000 characters'),
  check('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  check('category')
    .optional()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
  check('minScore')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Min score must be between 0 and 1'),
  check('documentId')
    .optional()
    .isMongoId().withMessage('Invalid document ID'),
];

// Validation for document metadata update
const validateDocumentUpdate = [
  check('title')
    .optional()
    .isLength({ max: 300 }).withMessage('Title must be less than 300 characters'),
  check('category')
    .optional()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
  check('tags')
    .optional()
    .isArray().withMessage('Tags must be an array')
    .custom((tags) => tags.every((t) => typeof t === 'string' && t.length <= 50))
    .withMessage('Each tag must be a string of 50 characters or less'),
];

// Validation for list query params
const validateListQuery = [
  query('status')
    .optional()
    .isIn(['uploaded', 'processing', 'indexed', 'failed'])
    .withMessage('Status must be one of: uploaded, processing, indexed, failed'),
  query('category')
    .optional()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 }).withMessage('Skip must be a positive integer'),
  query('search')
    .optional()
    .isLength({ max: 200 }).withMessage('Search must be less than 200 characters'),
];

// Validation for document ID params
const validateDocumentId = [
  check('documentId')
    .isMongoId().withMessage('Invalid document ID'),
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
  validateKnowledgeSearch,
  validateRetrieve,
  validateDocumentUpdate,
  validateListQuery,
  validateDocumentId,
  handleValidation,
};