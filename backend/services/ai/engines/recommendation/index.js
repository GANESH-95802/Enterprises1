/**
 * Recommendation Engine (Phase 3B)
 * Enterprise Recommendation Engine that integrates with the AI Enterprise Hub.
 * Reuses AI Orchestrator, Assistant Engine, Memory Manager, Context Manager,
 * Query Router, Embedding Client, AiEmbedding Model, AI Cache, AI Safety Filter,
 * AI Rate Limiter, and Audit Logger.
 *
 * Modules:
 * - Recommendation Service: Candidate sourcing
 * - Ranking Engine: Weighted ranking
 * - Similarity Engine: Embedding similarity
 * - Scoring Engine: Composite scoring
 * - Personalization Engine: User preference learning
 * - Feedback Manager: Feedback handling
 * - Recommendation Cache: Result caching
 * - Recommendation Utilities: Shared helpers
 */
const recommendationService = require('./recommendationService');
const rankingEngine = require('./rankingEngine');
const similarityEngine = require('./similarityEngine');
const scoringEngine = require('./scoringEngine');
const personalizationEngine = require('./personalizationEngine');
const feedbackManager = require('./feedbackManager');
const recommendationCache = require('./recommendationCache');
const {
  RECOMMENDATION_TYPES,
  RECOMMENDATION_SOURCES,
  FEEDBACK_TYPES,
  isValidType,
  isValidFeedbackType,
} = require('./recommendationUtils');
const Recommendation = require('../../../../models/Recommendation');
const contextManager = require('../../orchestrator/contextManager');
const memoryManager = require('../../orchestrator/memoryManager');

class RecommendationEngine {
  constructor() {
    this.initialized = false;
    this.stats = {
      totalRecommendations: 0,
      totalPersonalized: 0,
      totalFeedback: 0,
      totalSimilar: 0,
      errors: 0,
    };
  }

  /**
   * Initialize the recommendation engine
   */
  initialize() {
    this.initialized = true;
    console.log('Recommendation Engine initialized');
    return true;
  }

  /**
   * Get recommendations for a user.
   * @param {string} userId - User ID
   * @param {Object} options - { type, category, limit, skip, query, sessionId, weights, useCache }
   * @returns {Promise<Object>} - { success, data }
   */
  async getRecommendations(userId, options = {}) {
    this.stats.totalRecommendations += 1;

    try {
      if (!this.initialized) this.initialize();

      const type = options.type || 'personalized';
      if (!isValidType(type)) {
        return { success: false, message: `Invalid recommendation type: ${type}` };
      }

      const useCache = options.useCache !== false;
      const limit = Math.min(options.limit || 10, 50);
      const skip = options.skip || 0;

      // Check cache first
      if (useCache) {
        const cached = await recommendationCache.get(userId, {
          type,
          category: options.category,
          limit,
          skip,
          sessionId: options.sessionId,
          query: options.query,
        });
        if (cached.hit) {
          return { success: true, data: cached.data, cached: true };
        }
      }

      // Build user profile and category affinity in parallel
      const [profileResult, affinityResult, sessionResult] = await Promise.all([
        personalizationEngine.buildUserProfile(userId),
        personalizationEngine.computeCategoryAffinity(userId),
        options.sessionId
          ? personalizationEngine.getSessionContext(userId, options.sessionId)
          : Promise.resolve({ success: true, sessionContext: null }),
      ]);

      if (!profileResult.success) {
        return { success: false, message: profileResult.message };
      }

      const profile = profileResult.profile;
      const categoryAffinity = affinityResult.success ? affinityResult.affinity : {};
      const sessionContext = sessionResult.success ? sessionResult.sessionContext : null;

      // Gather candidates
      const gatherResult = await recommendationService.gatherCandidates(userId, type, {
        limit: limit * 3,
        category: options.category,
        query: options.query,
      });

      if (!gatherResult.success) {
        return { success: false, message: gatherResult.message };
      }

      // Get feedback stats for candidates
      const candidateIds = gatherResult.candidates
        .filter((c) => c.sourceId)
        .map((c) => c.sourceId);
      const feedbackStats = await feedbackManager.getFeedbackStatsForRecommendations(candidateIds);

      // Rank candidates
      const ranked = await rankingEngine.rank(profile, gatherResult.candidates, {
        weights: options.weights,
        categoryAffinity,
        feedbackStats,
        limit,
        skip,
        query: options.query,
      });

      if (!ranked.success) {
        return { success: false, message: ranked.message };
      }

      // Persist recommendations
      const persisted = await this._persistRecommendations(userId, ranked.items, {
        type,
        sessionId: options.sessionId,
        query: options.query,
      });

      const data = {
        recommendations: persisted,
        total: ranked.total,
        limit: ranked.limit,
        skip: ranked.skip,
        pages: ranked.pages,
        type,
        category: options.category || null,
        personalized: {
          profile: {
            skills: profile.skills,
            interests: profile.interests,
            categories: profile.categories,
          },
          categoryAffinity,
          sessionContext,
        },
        timestamp: new Date().toISOString(),
      };

      // Cache the result
      if (useCache) {
        await recommendationCache.set(userId, {
          type,
          category: options.category,
          limit,
          skip,
          sessionId: options.sessionId,
          query: options.query,
        }, data);
      }

      return { success: true, data };
    } catch (error) {
      this.stats.errors += 1;
      console.error('Recommendation Engine - get error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get personalized recommendations for a user.
   * Uses profile, affinity, session, and history context.
   * @param {string} userId - User ID
   * @param {Object} options - { limit, skip, sessionId, query, weights }
   * @returns {Promise<Object>} - { success, data }
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    this.stats.totalPersonalized += 1;

    try {
      const [profileResult, affinityResult, historyResult, sessionResult] = await Promise.all([
        personalizationEngine.buildUserProfile(userId),
        personalizationEngine.computeCategoryAffinity(userId),
        personalizationEngine.getHistoryContext(userId),
        options.sessionId
          ? personalizationEngine.getSessionContext(userId, options.sessionId)
          : Promise.resolve({ success: true, sessionContext: null }),
      ]);

      if (!profileResult.success) {
        return { success: false, message: profileResult.message };
      }

      const profile = profileResult.profile;
      const categoryAffinity = affinityResult.success ? affinityResult.affinity : {};
      const historyContext = historyResult.success ? historyResult.historyContext : null;
      const sessionContext = sessionResult.success ? sessionResult.sessionContext : null;

      // Gather personalized candidates
      const gatherResult = await recommendationService.gatherCandidates(userId, 'personalized', {
        limit: (options.limit || 10) * 3,
        query: options.query,
      });

      if (!gatherResult.success) {
        return { success: false, message: gatherResult.message };
      }

      // Get feedback stats
      const candidateIds = gatherResult.candidates
        .filter((c) => c.sourceId)
        .map((c) => c.sourceId);
      const feedbackStats = await feedbackManager.getFeedbackStatsForRecommendations(candidateIds);

      // Rank with personalization context
      const ranked = await rankingEngine.rank(profile, gatherResult.candidates, {
        weights: options.weights,
        categoryAffinity,
        feedbackStats,
        limit: options.limit || 10,
        skip: options.skip || 0,
        query: options.query,
      });

      if (!ranked.success) {
        return { success: false, message: ranked.message };
      }

      // Persist recommendations
      const persisted = await this._persistRecommendations(userId, ranked.items, {
        type: 'personalized',
        sessionId: options.sessionId,
        query: options.query,
      });

      return {
        success: true,
        data: {
          recommendations: persisted,
          total: ranked.total,
          limit: ranked.limit,
          skip: ranked.skip,
          pages: ranked.pages,
          personalization: {
            profile: {
              skills: profile.skills,
              interests: profile.interests,
              categories: profile.categories,
              feedbackPreferences: profile.feedbackPreferences,
            },
            categoryAffinity,
            historyContext,
            sessionContext,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.errors += 1;
      console.error('Recommendation Engine - personalized error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Submit feedback for a recommendation.
   * @param {string} userId - User ID
   * @param {string} recommendationId - Recommendation ID
   * @param {string} type - Feedback type
   * @param {Object} options - { rating, comment, source, metadata }
   * @returns {Promise<Object>} - { success, data }
   */
  async submitFeedback(userId, recommendationId, type, options = {}) {
    this.stats.totalFeedback += 1;

    try {
      if (!isValidFeedbackType(type)) {
        return { success: false, message: `Invalid feedback type: ${type}` };
      }

      const result = await feedbackManager.submitFeedback(userId, recommendationId, type, options);

      if (!result.success) {
        return { success: false, message: result.message };
      }

      // Invalidate cache since feedback affects ranking
      await recommendationCache.invalidate(userId);

      return { success: true, data: result.feedback };
    } catch (error) {
      this.stats.errors += 1;
      console.error('Recommendation Engine - feedback error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get recommendation history for a user.
   * @param {string} userId - User ID
   * @param {Object} options - { limit, skip, type, status }
   * @returns {Promise<Object>} - { success, data }
   */
  async getRecommendationHistory(userId, options = {}) {
    try {
      const query = { user: userId };
      if (options.type) query.type = options.type;
      if (options.status) query.status = options.status;

      const limit = Math.min(options.limit || 20, 100);
      const skip = options.skip || 0;

      const [items, total] = await Promise.all([
        Recommendation.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('title description type category source sourceId score scoreBreakdown status context createdAt'),
        Recommendation.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          items: items.map((rec) => ({
            id: rec._id,
            title: rec.title,
            description: rec.description,
            type: rec.type,
            category: rec.category,
            source: rec.source,
            sourceId: rec.sourceId,
            score: rec.score,
            scoreBreakdown: rec.scoreBreakdown,
            status: rec.status,
            context: rec.context,
            createdAt: rec.createdAt,
          })),
          total,
          limit,
          skip,
          pages: Math.ceil(total / limit),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Recommendation Engine - history error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get recommendation statistics for a user.
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, data }
   */
  async getRecommendationStats(userId) {
    try {
      const [total, byType, byCategory, byStatus, feedbackStats] = await Promise.all([
        Recommendation.countDocuments({ user: userId }),
        Recommendation.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Recommendation.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        Recommendation.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        feedbackManager.getUserFeedbackStats(userId),
      ]);

      const typeStats = byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const categoryStats = byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const statusStats = byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          total,
          byType: typeStats,
          byCategory: categoryStats,
          byStatus: statusStats,
          feedback: feedbackStats.success ? feedbackStats.stats : null,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Recommendation Engine - stats error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Find similar content to a given item.
   * @param {string} userId - User ID
   * @param {Object} options - { query, sourceId, type, limit }
   * @returns {Promise<Object>} - { success, data }
   */
  async findSimilar(userId, options = {}) {
    this.stats.totalSimilar += 1;

    try {
      const query = options.query || '';
      const limit = Math.min(options.limit || 10, 50);

      if (!query) {
        return { success: false, message: 'Query is required for similar content lookup' };
      }

      // Gather candidates from all sources
      const gatherResult = await recommendationService.gatherCandidates(userId, 'personalized', {
        limit: limit * 3,
        query,
      });

      if (!gatherResult.success) {
        return { success: false, message: gatherResult.message };
      }

      // Use query-based similarity ranking
      const ranked = await rankingEngine.rank({}, gatherResult.candidates, {
        limit,
        query,
      });

      if (!ranked.success) {
        return { success: false, message: ranked.message };
      }

      return {
        success: true,
        data: {
          query,
          items: ranked.items.map((item) => ({
            title: item.title,
            description: item.description,
            category: item.category,
            tags: item.tags,
            source: item.source,
            sourceId: item.sourceId,
            score: item.score,
            scoreBreakdown: item.scoreBreakdown,
          })),
          total: ranked.total,
          limit: ranked.limit,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.errors += 1;
      console.error('Recommendation Engine - similar error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get available recommendation types.
   * @returns {Object} - { success, data }
   */
  getTypes() {
    return {
      success: true,
      data: {
        types: RECOMMENDATION_TYPES,
        sources: RECOMMENDATION_SOURCES,
        feedbackTypes: FEEDBACK_TYPES,
      },
    };
  }

  /**
   * Get recommendation engine statistics.
   * @returns {Object} - { success, data }
   */
  getStats() {
    return {
      success: true,
      data: {
        engine: { ...this.stats },
        service: recommendationService.getStats(),
        ranking: rankingEngine.getStats(),
        similarity: similarityEngine.getStats(),
        scoring: scoringEngine.getStats(),
        personalization: personalizationEngine.getStats(),
        feedback: feedbackManager.getStats(),
        cache: recommendationCache.getStats(),
      },
    };
  }

  /**
   * Persist ranked recommendations to the Recommendation model.
   * @param {string} userId - User ID
   * @param {Array<Object>} items - Ranked items
   * @param {Object} context - { type, sessionId, query }
   * @returns {Promise<Array<Object>>} - Persisted recommendations
   * @private
   */
  async _persistRecommendations(userId, items = [], context = {}) {
    const persisted = [];

    for (const item of items) {
      try {
        const rec = await Recommendation.create({
          user: userId,
          type: context.type || 'personalized',
          title: item.title || item.name || 'Untitled Recommendation',
          description: item.description || '',
          source: item.source || 'other',
          sourceId: item.sourceId || null,
          category: item.category || 'general',
          tags: item.tags || [],
          score: item.score || 0,
          scoreBreakdown: item.scoreBreakdown || {
            similarity: 0,
            preference: 0,
            popularity: 0,
            freshness: 0,
            feedback: 0,
            confidence: 0,
          },
          metadata: item.metadata || {},
          context: {
            sessionId: context.sessionId || '',
            query: context.query || '',
            sourceType: item.source || '',
          },
          status: 'delivered',
        });

        persisted.push({
          id: rec._id,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          category: rec.category,
          source: rec.source,
          sourceId: rec.sourceId,
          tags: rec.tags,
          score: rec.score,
          scoreBreakdown: rec.scoreBreakdown,
          metadata: rec.metadata,
          createdAt: rec.createdAt,
        });
      } catch (error) {
        console.error('Recommendation Engine - persist error:', error.message);
      }
    }

    return persisted;
  }
}

// Export singleton
const recommendationEngine = new RecommendationEngine();

module.exports = recommendationEngine;
module.exports.RecommendationEngine = RecommendationEngine;