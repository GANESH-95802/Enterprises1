/**
 * Document Intelligence Validators - Request validation for Phase 3C Document Intelligence endpoints.
 */
const { check, query, param, validationResult } = require('express-validator');

// Document types for classification filtering
const DOCUMENT_TYPES = [
  'resume', 'invoice', 'form', 'contract', 'report',
  'email', 'letter', 'presentation', 'spreadsheet',
  'legal', 'technical', 'financial', 'marketing',
  'medical', 'academic', 'general',
];

// File types supported by document intelligence
const FILE_TYPES = ['pdf', 'docx', 'txt', 'markdown', 'md', 'text', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'];

// Validation for document upload + analysis
const validateUploadAndAnalyze = [
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
  check('language')
    .optional()
    .isLength({ max: 10 }).withMessage('Language must be less than 10 characters'),
  check('useAI')
    .optional()
    .isBoolean().withMessage('useAI must be a boolean'),
  check('maxSentences')
    .optional()
    .isInt({ min: 1, max: 15 }).withMessage('maxSentences must be between 1 and 15'),
];

// Validation for document analysis
const validateAnalyzeDocument = [
  param('analysisId')
    .isMongoId().withMessage('Invalid analysis document ID'),
];

// Validation for information extraction
const validateExtractInformation = [
  param('analysisId')
    .isMongoId().withMessage('Invalid analysis document ID'),
  check('fields')
    .optional()
    .isArray().withMessage('Fields must be an array')
    .custom((fields) => fields.every((f) => typeof f === 'string' && f.length <= 50))
    .withMessage('Each field must be a string of 50 characters or less'),
];

// Validation for document summarization
const validateSummarizeDocument = [
  param('analysisId')
    .isMongoId().withMessage('Invalid analysis document ID'),
  check('regenerate')
    .optional()
    .isBoolean().withMessage('regenerate must be a boolean'),
  check('maxSentences')
    .optional()
    .isInt({ min: 1, max: 15 }).withMessage('maxSentences must be between 1 and 15'),
  check('useAI')
    .optional()
    .isBoolean().withMessage('useAI must be a boolean'),
];

// Validation for document comparison
const validateCompareDocuments = [
  check('sourceId')
    .isMongoId().withMessage('Invalid source document ID'),
  check('targetId')
    .isMongoId().withMessage('Invalid target document ID'),
];

// Validation for similar document lookup
const validateFindSimilar = [
  param('analysisId')
    .isMongoId().withMessage('Invalid analysis document ID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  query('minScore')
    .optional()
    .isFloat({ min: 0, max: 1 }).withMessage('Min score must be between 0 and 1'),
];

// Validation for listing documents
const validateListDocuments = [
  query('status')
    .optional()
    .isIn(['uploaded', 'processing', 'analyzed', 'failed'])
    .withMessage('Status must be one of: uploaded, processing, analyzed, failed'),
  query('category')
    .optional()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters'),
  query('fileType')
    .optional()
    .isIn(FILE_TYPES)
    .withMessage(`File type must be one of: ${FILE_TYPES.join(', ')}`),
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
  param('analysisId')
    .isMongoId().withMessage('Invalid analysis document ID'),
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
  validateUploadAndAnalyze,
  validateAnalyzeDocument,
  validateExtractInformation,
  validateSummarizeDocument,
  validateCompareDocuments,
  validateFindSimilar,
  validateListDocuments,
  validateDocumentId,
  handleValidation,
};