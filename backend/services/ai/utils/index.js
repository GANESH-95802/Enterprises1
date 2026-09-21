/**
 * AI Utilities
 * Shared utility functions for the AI infrastructure layer.
 */

// Generate a unique request ID
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Format errors consistently
const formatError = (error, context = '') => {
  const message = error?.message || error || 'Unknown error';
  return {
    error: true,
    message,
    context: context || null,
    timestamp: new Date().toISOString(),
  };
};

// Estimate token count from text (approximation: ~4 chars per token)
const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
};

// Check if a string is valid JSON
const isValidJSON = (str) => {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Truncate text to max length
const truncate = (text, maxLength = 1000) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Sanitize user input for AI prompts (basic injection prevention)
const sanitizeForPrompt = (input) => {
  if (!input) return '';
  return String(input)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
};

module.exports = {
  generateRequestId,
  formatError,
  estimateTokens,
  isValidJSON,
  truncate,
  sanitizeForPrompt,
};