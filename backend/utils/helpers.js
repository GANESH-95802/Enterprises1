const jwt = require('jsonwebtoken');

// Generate JWT access token with configurable expiry (default: 15 minutes)
const generateToken = (id, expiresIn = '15m') => {
  return jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, { expiresIn });
};

// Generate refresh token (7 days)
const generateRefreshToken = (id) => {
  return jwt.sign({ id, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit), page: parseInt(page) };
};

// Build paginated response
const paginatedResponse = (data, total, page, limit) => ({
  success: true,
  data,
  pagination: {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: Math.ceil(total / limit),
  },
});

// Sanitize object - remove specified keys
const sanitizeObject = (obj, keysToRemove = ['password', '__v']) => {
  const sanitized = { ...obj };
  keysToRemove.forEach(key => delete sanitized[key]);
  return sanitized;
};

// Generate random string
const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

// Format date for display
const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toISOString();
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

// Async handler wrapper to avoid try-catch repetition
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  generateToken,
  generateRefreshToken,
  paginate,
  paginatedResponse,
  sanitizeObject,
  generateRandomString,
  formatDate,
  isValidObjectId,
  asyncHandler,
};