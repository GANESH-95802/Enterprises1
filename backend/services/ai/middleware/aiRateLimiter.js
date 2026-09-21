const rateLimit = require('express-rate-limit');

/**
 * AI Rate Limiter
 * Prevents AI API abuse and excessive LLM costs.
 * Separate limits for general AI queries and chat endpoints.
 */
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per user
  message: { success: false, message: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

// Stricter limit for expensive operations (image analysis, embeddings)
const aiHeavyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many heavy AI operations, please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

// Daily limit to control overall LLM spending
const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 500,
  message: { success: false, message: 'Daily AI request limit reached. Please try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

module.exports = { aiRateLimiter, aiHeavyLimiter, aiDailyLimiter };