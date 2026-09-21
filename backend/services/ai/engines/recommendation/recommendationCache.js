/**
 * Recommendation Cache
 * Caches recommendation results using the existing AiCache model.
 * Reduces redundant computation and embedding calls.
 * Follows SOLID principles — this module is solely responsible for caching.
 */
const AiCache = require('../../../../models/AiCache');
const { generateCacheKey } = require('./recommendationUtils');

class RecommendationCache {
  constructor() {
    this.defaultTTL = parseInt(process.env.RECOMMENDATION_CACHE_TTL || '300', 10); // 5 minutes
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0,
    };
  }

  /**
   * Get cached recommendations for a user and options.
   * @param {string} userId - User ID
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - { hit, data }
   */
  async get(userId, options = {}) {
    try {
      const key = generateCacheKey(userId, options);
      const cached = await AiCache.findOne({ key, user: userId });

      if (cached && cached.expiresAt > new Date()) {
        this.stats.hits += 1;
        return { hit: true, data: cached.data };
      }

      this.stats.misses += 1;
      return { hit: false, data: null };
    } catch (error) {
      console.error('Recommendation Cache - get error:', error.message);
      return { hit: false, data: null };
    }
  }

  /**
   * Save recommendations to cache.
   * @param {string} userId - User ID
   * @param {Object} options - Request options
   * @param {Object} data - Data to cache
   * @param {number} ttlSeconds - TTL in seconds
   * @returns {Promise<boolean>} - True if saved
   */
  async set(userId, options = {}, data, ttlSeconds = this.defaultTTL) {
    try {
      const key = generateCacheKey(userId, options);

      await AiCache.findOneAndUpdate(
        { key, user: userId },
        {
          key,
          user: userId,
          data,
          provider: 'recommendation',
          model: 'recommendation-engine',
          expiresAt: new Date(Date.now() + ttlSeconds * 1000),
          metadata: {
            type: 'recommendation',
            options,
          },
        },
        { upsert: true, new: true }
      );

      this.stats.saves += 1;
      return true;
    } catch (error) {
      console.error('Recommendation Cache - set error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate cached recommendations for a user.
   * @param {string} userId - User ID
   * @param {Object} options - Optional request options to invalidate specific cache
   * @returns {Promise<boolean>} - True if invalidated
   */
  async invalidate(userId, options = null) {
    try {
      if (options) {
        const key = generateCacheKey(userId, options);
        await AiCache.deleteOne({ key, user: userId });
      } else {
        // Invalidate all recommendation caches for the user
        await AiCache.deleteMany({
          user: userId,
          'metadata.type': 'recommendation',
        });
      }
      return true;
    } catch (error) {
      console.error('Recommendation Cache - invalidate error:', error.message);
      return false;
    }
  }

  /**
   * Get recommendation cache statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const recommendationCache = new RecommendationCache();

module.exports = recommendationCache;
module.exports.RecommendationCache = RecommendationCache;