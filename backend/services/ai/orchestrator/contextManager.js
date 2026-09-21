const User = require('../../../models/User');
const Business = require('../../../models/Business');
const Product = require('../../../models/Product');
const AiCache = require('../../../models/AiCache');

/**
 * Context Manager
 * Builds and manages AI context from enterprise data.
 * Loads relevant user, business, and product context for AI queries.
 */
class ContextManager {
  constructor() {
    this.contextCache = new Map();
    this.cacheTTL = 60 * 1000; // 1 minute default TTL
    this.maxContextSize = 4000; // Max characters of context to include
  }

  /**
   * Build user context
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User context object
   */
  async buildUserContext(userId) {
    try {
      const cacheKey = `user:${userId}`;
      const cached = this.contextCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      const user = await User.findById(userId).select('name email role department position');
      if (!user) return {};

      const context = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || 'N/A',
        position: user.position || 'N/A',
      };

      this.contextCache.set(cacheKey, { data: context, timestamp: Date.now() });
      return context;
    } catch (error) {
      console.error('Context Manager - user context error:', error.message);
      return {};
    }
  }

  /**
   * Build enterprise context (business + product stats)
   * @returns {Promise<Object>} - Enterprise context object
   */
  async buildEnterpriseContext() {
    try {
      const cacheKey = 'enterprise';
      const cached = this.contextCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }

      const [
        totalBusinesses,
        totalProducts,
        activeBusinesses,
        totalUsers,
      ] = await Promise.all([
        Business.countDocuments(),
        Product.countDocuments(),
        Business.countDocuments({ status: 'active' }),
        User.countDocuments(),
      ]);

      const context = {
        stats: {
          totalBusinesses,
          totalProducts,
          activeBusinesses,
          totalUsers,
          businessHealth: totalBusinesses > 0
            ? ((activeBusinesses / totalBusinesses) * 100).toFixed(1) + '%'
            : 'N/A',
        },
        timestamp: new Date().toISOString(),
      };

      this.contextCache.set(cacheKey, { data: context, timestamp: Date.now() });
      return context;
    } catch (error) {
      console.error('Context Manager - enterprise context error:', error.message);
      return {};
    }
  }

  /**
   * Build comprehensive context for an AI query
   * @param {string} userId - User ID
   * @param {Object} options - Options for context building
   * @returns {Promise<Object>} - Combined context
   */
  async buildQueryContext(userId, options = {}) {
    const [userContext, enterpriseContext] = await Promise.all([
      this.buildUserContext(userId),
      this.buildEnterpriseContext(),
    ]);

    return {
      user: userContext,
      enterprise: enterpriseContext.data || enterpriseContext,
      request: {
        timestamp: new Date().toISOString(),
        type: options.type || 'general',
      },
    };
  }

  /**
   * Convert context object to a prompt-compatible string
   * @param {Object} context - Context object
   * @returns {string} - Context as text
   */
  contextToPrompt(context) {
    try {
      const parts = [];

      if (context.user) {
        parts.push(`Current User: ${context.user.name} (${context.user.role})`);
        parts.push(`Department: ${context.user.department || 'N/A'}`);
        parts.push(`Position: ${context.user.position || 'N/A'}`);
      }

      if (context.enterprise && context.enterprise.stats) {
        const stats = context.enterprise.stats;
        parts.push(`Enterprise Stats:`);
        parts.push(`- Businesses: ${stats.totalBusinesses}`);
        parts.push(`- Products: ${stats.totalProducts}`);
        parts.push(`- Active Businesses: ${stats.activeBusinesses}`);
        parts.push(`- Total Users: ${stats.totalUsers}`);
        if (stats.businessHealth !== 'N/A') {
          parts.push(`- Business Health: ${stats.businessHealth}`);
        }
      }

      let contextText = parts.join('\n');
      if (contextText.length > this.maxContextSize) {
        contextText = contextText.substring(0, this.maxContextSize) + '\n... (context truncated)';
      }

      return contextText;
    } catch (error) {
      console.error('Context Manager - prompt conversion error:', error.message);
      return '';
    }
  }

  /**
   * Load cached context for a query
   * @param {string} query - The user's query
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Cached context or null
   */
  async loadCachedContext(query, userId) {
    try {
      const cacheKey = this.generateCacheKey(query, userId);
      const cached = await AiCache.findOne({ key: cacheKey, user: userId });

      if (cached && cached.expiresAt > new Date()) {
        return {
          key: cacheKey,
          data: cached.data,
          createdAt: cached.createdAt,
          hit: true,
        };
      }

      return { key: cacheKey, hit: false };
    } catch (error) {
      console.error('Context Manager - cache load error:', error.message);
      return { hit: false };
    }
  }

  /**
   * Save context to cache
   * @param {string} key - Cache key
   * @param {string} userId - User ID
   * @param {Object} data - Data to cache
   * @param {number} ttlSeconds - TTL in seconds
   */
  async saveToCache(key, userId, data, ttlSeconds = 300) {
    try {
      await AiCache.findOneAndUpdate(
        { key, user: userId },
        {
          key,
          user: userId,
          data,
          expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        },
        { upsert: true, new: true }
      );
      return true;
    } catch (error) {
      console.error('Context Manager - cache save error:', error.message);
      return false;
    }
  }

  /**
   * Invalidate cached context
   * @param {string} key - Cache key
   * @param {string} userId - User ID
   */
  async invalidateCache(key, userId) {
    try {
      await AiCache.deleteOne({ key, user: userId });
      return true;
    } catch (error) {
      console.error('Context Manager - cache invalidation error:', error.message);
      return false;
    }
  }

  /**
   * Generate a deterministic cache key from query and user
   */
  generateCacheKey(query, userId) {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const hash = require('crypto').createHash('sha256').update(normalized).digest('hex').substring(0, 16);
    return `${userId}:${hash}`;
  }

  /**
   * Clear in-memory context cache
   */
  clearMemoryCache() {
    this.contextCache.clear();
  }

  /**
   * Get context manager stats
   */
  getStats() {
    return {
      memoryCacheSize: this.contextCache.size,
      maxContextSize: this.maxContextSize,
      cacheTTL: this.cacheTTL,
    };
  }
}

// Export singleton
const contextManager = new ContextManager();

module.exports = contextManager;
module.exports.ContextManager = ContextManager;