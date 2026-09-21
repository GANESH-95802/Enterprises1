const jwt = require('jsonwebtoken');

/**
 * In-memory token blacklist for JWT revocation
 * For production with multiple instances, replace with Redis.
 * 
 * Key: token string
 * Value: expiry timestamp (ms)
 */
const blacklist = new Map();

/**
 * Add a token to the blacklist
 * The token remains blacklisted until its natural expiry
 */
const addToBlacklist = (token) => {
  try {
    const decoded = jwt.decode(token);
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;
    blacklist.set(token, expiresAt);
  } catch {
    // If token can't be decoded, blacklist for access token lifetime (15 min)
    blacklist.set(token, Date.now() + 15 * 60 * 1000);
  }
  cleanup();
};

/**
 * Check if a token is blacklisted
 */
const isBlacklisted = (token) => {
  cleanup();
  return blacklist.has(token);
};

/**
 * Remove expired entries to prevent unbounded memory growth
 */
const cleanup = () => {
  const now = Date.now();
  for (const [token, expiresAt] of blacklist) {
    if (expiresAt < now) {
      blacklist.delete(token);
    }
  }
};

/**
 * Get current blacklist size (for monitoring)
 */
const getBlacklistSize = () => {
  cleanup();
  return blacklist.size;
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
  getBlacklistSize,
};