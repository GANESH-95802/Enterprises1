/**
 * Recommendation Utilities
 * Shared helper functions for the Enterprise Recommendation Engine (Phase 3B).
 * Follows SOLID principles — this module is solely responsible for utility helpers.
 */

// Recommendation types supported by the engine
const RECOMMENDATION_TYPES = [
  'learning',
  'skill',
  'career',
  'course',
  'certification',
  'job',
  'enterprise',
  'personalized',
];

// Recommendation sources
const RECOMMENDATION_SOURCES = [
  'profile',
  'skill',
  'certificate',
  'business',
  'product',
  'customer',
  'knowledge',
  'conversation',
  'course',
  'job',
  'enterprise',
  'assistant',
  'other',
];

// Feedback types
const FEEDBACK_TYPES = ['like', 'dislike', 'ignore', 'saved', 'clicked'];

// Default ranking weights
const DEFAULT_WEIGHTS = {
  similarity: 0.35,
  preference: 0.20,
  popularity: 0.15,
  freshness: 0.10,
  feedback: 0.10,
  confidence: 0.10,
};

/**
 * Normalize a score to the range [0, 1]
 * @param {number} value - Raw score
 * @param {number} min - Minimum possible value
 * @param {number} max - Maximum possible value
 * @returns {number} - Normalized score (0-1)
 */
const normalizeScore = (value, min = 0, max = 1) => {
  if (value === null || value === undefined || isNaN(value)) return 0;
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {number} - Clamped value
 */
const clamp = (value, min = 0, max = 1) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Compute a freshness score based on age.
 * Newer items score higher. Uses exponential decay.
 * @param {Date|string} date - Item date
 * @param {number} halfLifeDays - Half-life in days (default: 30)
 * @returns {number} - Freshness score (0-1)
 */
const freshnessScore = (date, halfLifeDays = 30) => {
  if (!date) return 0;
  const ageMs = Date.now() - new Date(date).getTime();
  if (ageMs <= 0) return 1;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / halfLifeDays);
};

/**
 * Compute a popularity score from a count.
 * Uses logarithmic scaling to dampen large counts.
 * @param {number} count - Popularity count (views, clicks, etc.)
 * @param {number} maxCount - Reference max count for scaling
 * @returns {number} - Popularity score (0-1)
 */
const popularityScore = (count, maxCount = 100) => {
  if (!count || count <= 0) return 0;
  return clamp(Math.log10(1 + count) / Math.log10(1 + maxCount));
};

/**
 * Compute a confidence score based on data completeness.
 * @param {Object} item - Recommendation candidate
 * @returns {number} - Confidence score (0-1)
 */
const confidenceScore = (item = {}) => {
  if (!item) return 0;
  let signals = 0;
  let total = 0;

  // Title/name present
  total += 1;
  if (item.title || item.name) signals += 1;

  // Description present
  total += 1;
  if (item.description) signals += 1;

  // Category present
  total += 1;
  if (item.category) signals += 1;

  // Tags present
  total += 1;
  if (item.tags && item.tags.length > 0) signals += 1;

  // Source ID present
  total += 1;
  if (item.sourceId) signals += 1;

  // Metadata present
  total += 1;
  if (item.metadata && Object.keys(item.metadata).length > 0) signals += 1;

  return total > 0 ? signals / total : 0;
};

/**
 * Build a text representation of a candidate for embedding/similarity.
 * @param {Object} item - Recommendation candidate
 * @returns {string} - Combined text
 */
const buildCandidateText = (item = {}) => {
  const parts = [];
  if (item.title) parts.push(item.title);
  if (item.name) parts.push(item.name);
  if (item.description) parts.push(item.description);
  if (item.category) parts.push(item.category);
  if (item.tags && item.tags.length > 0) parts.push(item.tags.join(' '));
  if (item.skills && item.skills.length > 0) parts.push(item.skills.join(' '));
  return parts.join(' ').trim();
};

/**
 * Build a user profile text for embedding/similarity.
 * @param {Object} profile - User profile data
 * @returns {string} - Combined text
 */
const buildProfileText = (profile = {}) => {
  const parts = [];
  if (profile.name) parts.push(profile.name);
  if (profile.department) parts.push(profile.department);
  if (profile.position) parts.push(profile.position);
  if (profile.skills && profile.skills.length > 0) parts.push(profile.skills.join(' '));
  if (profile.interests && profile.interests.length > 0) parts.push(profile.interests.join(' '));
  if (profile.categories && profile.categories.length > 0) parts.push(profile.categories.join(' '));
  return parts.join(' ').trim();
};

/**
 * Merge ranking weights with defaults.
 * @param {Object} weights - Custom weights
 * @returns {Object} - Merged weights
 */
const mergeWeights = (weights = {}) => {
  const merged = { ...DEFAULT_WEIGHTS };
  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    if (weights[key] !== undefined && !isNaN(weights[key])) {
      merged[key] = clamp(parseFloat(weights[key]), 0, 1);
    }
  }
  // Normalize so weights sum to 1
  const total = Object.values(merged).reduce((sum, w) => sum + w, 0);
  if (total > 0) {
    for (const key of Object.keys(merged)) {
      merged[key] = merged[key] / total;
    }
  }
  return merged;
};

/**
 * Deduplicate candidates by sourceId or title.
 * @param {Array<Object>} items - Candidate items
 * @returns {Array<Object>} - Deduplicated items
 */
const deduplicate = (items = []) => {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = item.sourceId
      ? `id:${item.sourceId}`
      : `title:${(item.title || item.name || '').toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

/**
 * Paginate an array.
 * @param {Array} items - Items to paginate
 * @param {number} limit - Max items per page
 * @param {number} skip - Items to skip
 * @returns {Object} - { items, total, limit, skip }
 */
const paginate = (items = [], limit = 10, skip = 0) => {
  const total = items.length;
  const sliced = items.slice(skip, skip + limit);
  return {
    items: sliced,
    total,
    limit,
    skip,
    pages: Math.ceil(total / limit),
  };
};

/**
 * Generate a cache key for recommendation requests.
 * @param {string} userId - User ID
 * @param {Object} options - Request options
 * @returns {string} - Cache key
 */
const generateCacheKey = (userId, options = {}) => {
  const crypto = require('crypto');
  const parts = [
    userId,
    options.type || 'all',
    options.category || 'all',
    options.limit || 10,
    options.sessionId || '',
    options.query || '',
  ];
  const raw = parts.join(':');
  return `rec:${crypto.createHash('sha256').update(raw).digest('hex').substring(0, 24)}`;
};

/**
 * Validate a recommendation type.
 * @param {string} type - Recommendation type
 * @returns {boolean} - True if valid
 */
const isValidType = (type) => RECOMMENDATION_TYPES.includes(type);

/**
 * Validate a feedback type.
 * @param {string} type - Feedback type
 * @returns {boolean} - True if valid
 */
const isValidFeedbackType = (type) => FEEDBACK_TYPES.includes(type);

module.exports = {
  RECOMMENDATION_TYPES,
  RECOMMENDATION_SOURCES,
  FEEDBACK_TYPES,
  DEFAULT_WEIGHTS,
  normalizeScore,
  clamp,
  freshnessScore,
  popularityScore,
  confidenceScore,
  buildCandidateText,
  buildProfileText,
  mergeWeights,
  deduplicate,
  paginate,
  generateCacheKey,
  isValidType,
  isValidFeedbackType,
};