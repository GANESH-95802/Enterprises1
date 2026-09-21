const { body, param, query } = require('express-validator');

const idParam = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
];

const paginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
];

const businessValidation = [
  body('name').trim().notEmpty().withMessage('Business name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Invalid status'),
];

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
];

const customerValidation = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
];

const complianceValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').trim().notEmpty().withMessage('Type is required'),
  body('status').optional().isIn(['compliant', 'non-compliant', 'pending', 'in-progress']),
];

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('status').optional().isIn(['planning', 'in-progress', 'completed', 'on-hold', 'cancelled']),
];

const healthcareValidation = [
  body('patientName').trim().notEmpty().withMessage('Patient name is required'),
  body('recordType').trim().notEmpty().withMessage('Record type is required'),
];

const skillValidation = [
  body('name').trim().notEmpty().withMessage('Skill name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

const certificateValidation = [
  body('title').trim().notEmpty().withMessage('Certificate title is required'),
  body('issuer').trim().notEmpty().withMessage('Issuer is required'),
];

const reportValidation = [
  body('title').trim().notEmpty().withMessage('Report title is required'),
  body('type').trim().notEmpty().withMessage('Report type is required'),
];

module.exports = {
  idParam,
  paginationQuery,
  businessValidation,
  productValidation,
  customerValidation,
  complianceValidation,
  projectValidation,
  healthcareValidation,
  skillValidation,
  certificateValidation,
  reportValidation,
};