/**
 * Feedback Manager
 * Manages user feedback on recommendations.
 * Supports like, dislike, ignore, saved, and clicked feedback types.
 * Stores feedback for future ranking adjustments.
 * Follows SOLID principles — this module is solely responsible for feedback management.
 */
const Recommendation = require('../../../../models/Recommendation');
const RecommendationFeedback = require('../../../../models/RecommendationFeedback');
const { isValidFeedbackType } = require('./recommendationUtils');

class FeedbackManager {
  constructor() {
    this.stats = {
      totalFeedback: 0,
      totalLikes: 0,
      totalDislikes: 0,
      totalIgnores: 0,
      totalSaves: 0,
      totalClicks: 0,
    };
  }

  /**
   * Submit feedback for a recommendation.
   * @param {string} userId - User ID
   * @param {string} recommendationId - Recommendation ID
   * @param {string} type - Feedback type (like, dislike, ignore, saved, clicked)
   * @param {Object} options - { rating, comment, source, metadata }
   * @returns {Promise<Object>} - { success, feedback }
   */
  async submitFeedback(userId, recommendationId, type, options = {}) {
    try {
      if (!isValidFeedbackType(type)) {
        return { success: false, message: `Invalid feedback type: ${type}` };
      }

      // Verify the recommendation belongs to the user
      const recommendation = await Recommendation.findOne({
        _id: recommendationId,
        user: userId,
      });

      if (!recommendation) {
        return { success: false, message: 'Recommendation not found' };
      }

      // Upsert feedback (one feedback per user per recommendation)
      const feedback = await RecommendationFeedback.findOneAndUpdate(
        { user: userId, recommendation: recommendationId },
        {
          user: userId,
          recommendation: recommendationId,
          type,
          rating: options.rating || 0,
          comment: options.comment || '',
          source: options.source || 'api',
          metadata: options.metadata || {},
        },
        { upsert: true, new: true }
      );

      // Update recommendation status based on feedback
      const statusMap = {
        like: 'clicked',
        dislike: 'dismissed',
        ignore: 'dismissed',
        saved: 'saved',
        clicked: 'clicked',
      };
      if (statusMap[type]) {
        recommendation.status = statusMap[type];
        await recommendation.save();
      }

      // Update stats
      this.stats.totalFeedback += 1;
      this.stats[`total${type.charAt(0).toUpperCase() + type.slice(1)}s`] += 1;

      return {
        success: true,
        feedback: {
          id: feedback._id,
          recommendationId: feedback.recommendation,
          type: feedback.type,
          rating: feedback.rating,
          comment: feedback.comment,
          source: feedback.source,
          createdAt: feedback.createdAt,
        },
      };
    } catch (error) {
      console.error('Feedback Manager - submit error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get feedback for a specific recommendation.
   * @param {string} userId - User ID
   * @param {string} recommendationId - Recommendation ID
   * @returns {Promise<Object>} - { success, feedback }
   */
  async getFeedback(userId, recommendationId) {
    try {
      const feedback = await RecommendationFeedback.findOne({
        user: userId,
        recommendation: recommendationId,
      });

      if (!feedback) {
        return { success: true, feedback: null };
      }

      return {
        success: true,
        feedback: {
          id: feedback._id,
          recommendationId: feedback.recommendation,
          type: feedback.type,
          rating: feedback.rating,
          comment: feedback.comment,
          source: feedback.source,
          createdAt: feedback.createdAt,
        },
      };
    } catch (error) {
      console.error('Feedback Manager - get error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get feedback statistics for a user.
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, stats }
   */
  async getUserFeedbackStats(userId) {
    try {
      const [total, byType, byCategory] = await Promise.all([
        RecommendationFeedback.countDocuments({ user: userId }),
        RecommendationFeedback.aggregate([
          { $match: { user: userId } },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        RecommendationFeedback.aggregate([
          { $match: { user: userId } },
          {
            $lookup: {
              from: 'recommendations',
              localField: 'recommendation',
              foreignField: '_id',
              as: 'rec',
            },
          },
          { $unwind: '$rec' },
          { $group: { _id: '$rec.category', count: { $sum: 1 } } },
        ]),
      ]);

      const typeStats = byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const categoryStats = byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        success: true,
        stats: {
          total,
          byType: typeStats,
          byCategory: categoryStats,
          positiveRate: total > 0
            ? ((typeStats.like || 0) + (typeStats.saved || 0) + (typeStats.clicked || 0)) / total
            : 0,
        },
      };
    } catch (error) {
      console.error('Feedback Manager - user stats error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get aggregate feedback stats for a set of recommendations.
   * Used by the Ranking Engine to adjust scores.
   * @param {Array<string>} recommendationIds - Recommendation IDs
   * @returns {Promise<Object>} - Map of recommendationId -> feedback stats
   */
  async getFeedbackStatsForRecommendations(recommendationIds = []) {
    try {
      if (recommendationIds.length === 0) return {};

      const feedback = await RecommendationFeedback.aggregate([
        { $match: { recommendation: { $in: recommendationIds } } },
        {
          $group: {
            _id: '$recommendation',
            likes: { $sum: { $cond: [{ $eq: ['$type', 'like'] }, 1, 0] } },
            dislikes: { $sum: { $cond: [{ $eq: ['$type', 'dislike'] }, 1, 0] } },
            ignores: { $sum: { $cond: [{ $eq: ['$type', 'ignore'] }, 1, 0] } },
            saves: { $sum: { $cond: [{ $eq: ['$type', 'saved'] }, 1, 0] } },
            clicks: { $sum: { $cond: [{ $eq: ['$type', 'clicked'] }, 1, 0] } },
            total: { $sum: 1 },
          },
        },
      ]);

      const result = {};
      for (const item of feedback) {
        result[item._id.toString()] = {
          likes: item.likes,
          dislikes: item.dislikes,
          ignores: item.ignores,
          saves: item.saves,
          clicks: item.clicks,
          total: item.total,
        };
      }

      return result;
    } catch (error) {
      console.error('Feedback Manager - aggregate error:', error.message);
      return {};
    }
  }

  /**
   * Get feedback history for a user.
   * @param {string} userId - User ID
   * @param {Object} options - { limit, skip, type }
   * @returns {Promise<Object>} - { success, items, total }
   */
  async getFeedbackHistory(userId, options = {}) {
    try {
      const query = { user: userId };
      if (options.type) {
        query.type = options.type;
      }

      const limit = Math.min(options.limit || 20, 100);
      const skip = options.skip || 0;

      const [items, total] = await Promise.all([
        RecommendationFeedback.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('recommendation', 'title type category score'),
        RecommendationFeedback.countDocuments(query),
      ]);

      return {
        success: true,
        items: items.map((fb) => ({
          id: fb._id,
          recommendationId: fb.recommendation?._id,
          title: fb.recommendation?.title || '',
          type: fb.type,
          rating: fb.rating,
          comment: fb.comment,
          source: fb.source,
          createdAt: fb.createdAt,
        })),
        total,
        limit,
        skip,
      };
    } catch (error) {
      console.error('Feedback Manager - history error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get feedback manager statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const feedbackManager = new FeedbackManager();

module.exports = feedbackManager;
module.exports.FeedbackManager = FeedbackManager;