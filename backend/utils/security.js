/**
 * Security utility functions for the AI Enterprise Hub
 * Provides input sanitization, NoSQL injection prevention, and XSS protection
 */

/**
 * Deep clean an object to remove NoSQL injection operators
 * - Strips keys starting with '$' (e.g., $where, $ne, $gt, $regex)
 * - Strips keys containing '.' (MongoDB dotted-key injection)
 * - Recursively processes nested objects and arrays
 */
const stripNoSQLInjection = (obj, depth = 0) => {
  // Prevent deep recursion abuse
  if (depth > 10) return {};

  if (Array.isArray(obj)) {
    return obj.map((item) => stripNoSQLInjection(item, depth + 1));
  }

  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      // Reject MongoDB operator keys ($where, $ne, $gt, $regex, etc.)
      if (key.startsWith('$')) continue;
      // Reject dotted keys (MongoDB treats dots as nested path separators)
      if (key.includes('.')) continue;
      // Reject keys with null bytes or control characters
      if (/[\x00-\x1F]/.test(key)) continue;
      clean[key] = stripNoSQLInjection(value, depth + 1);
    }
    return clean;
  }

  return obj;
};

/**
 * HTML-encode a string to prevent XSS attacks
 * Escapes: & < > " ' and other dangerous characters
 */
const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;');
};

/**
 * Sanitize a string by removing null bytes, control characters, and trimming
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // Remove null bytes and control characters (except \n, \t, \r)
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
};

/**
 * Sanitize any value based on its type
 * - Strings: HTML-encode + strip control chars
 * - Objects: strip NoSQL operators + recursively sanitize
 * - Arrays: recursively sanitize each element
 */
const sanitizeValue = (value, options = {}) => {
  const { encodeHTML = true } = options;

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    const cleaned = sanitizeString(value);
    // Limit string length to prevent abuse (default: 10KB)
    const maxLen = options.maxLength || 10000;
    const truncated = cleaned.length > maxLen ? cleaned.substring(0, maxLen) : cleaned;
    return encodeHTML ? escapeHTML(truncated) : truncated;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, options));
  }

  if (typeof value === 'object') {
    const cleaned = stripNoSQLInjection(value);
    const result = {};
    for (const [key, val] of Object.entries(cleaned)) {
      result[key] = sanitizeValue(val, options);
    }
    return result;
  }

  // Numbers, booleans, etc. are safe
  return value;
};

/**
 * Sanitize request body — strips NoSQL operators + XSS-encodes strings
 * Use AFTER express-validator validation passes
 */
const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body, { encodeHTML: false });
    // After stripping operators, re-encode strings for XSS protection
    req.body = sanitizeValue(req.body, { encodeHTML: true });
  }
  next();
};

/**
 * Sanitize request query — critical for NoSQL injection prevention
 * Strips $ operators from query string values
 */
const sanitizeQuery = (req, _res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = stripNoSQLInjection(req.query);
    // Clean sensitive values in query
    req.query = sanitizeValue(req.query, { encodeHTML: false });
  }
  next();
};

/**
 * Sanitize request params
 */
const sanitizeParams = (req, _res, next) => {
  if (req.params && typeof req.params === 'object') {
    req.params = stripNoSQLInjection(req.params);
  }
  next();
};

/**
 * Validate string type and length
 */
const sanitizeStringField = (value, { maxLength = 200, minLength = 1 } = {}) => {
  if (typeof value !== 'string') return null;
  const cleaned = sanitizeString(value);
  if (cleaned.length < minLength) return null;
  if (cleaned.length > maxLength) return cleaned.substring(0, maxLength);
  return cleaned;
};

/**
 * Check if a value looks like a dangerous NoSQL payload
 */
const containsNoSQLPattern = (obj) => {
  if (Array.isArray(obj)) {
    return obj.some((item) => containsNoSQLPattern(item));
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).some(
      (key) =>
        key.startsWith('$') ||
        key.includes('.') ||
        containsNoSQLPattern(obj[key])
    );
  }
  return false;
};

module.exports = {
  stripNoSQLInjection,
  escapeHTML,
  sanitizeString,
  sanitizeValue,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeStringField,
  containsNoSQLPattern,
};
