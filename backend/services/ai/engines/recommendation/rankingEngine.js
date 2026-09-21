/**
 * Ranking Engine
 * Ranks recommendation candidates using weighted composite scores.
 * Combines similarity, preference, popularity, freshness, feedback, and confidence.
 * Follows SOLID principles — this module is solely responsible for ranking.
 */
const scoringEngine = require('./scoringEngine');
const similarityEngine = require('./similarityEngine');
const { deduplicate, paginate, mergeWeights } = require('./recommendationUtils');

class RankingEngine {
  constructor() {
    this.stats = {
      totalRanked: 0,
      totalCandidates: 0,
    };
  }

  /**
   * Rank a batch of candidates.
   * Computes similarity scores, then composite scores, then sorts.
   * @param {Object} profile - User profile
   * @param {Array<Object>} candidates - Candidate items
   * @param {Object} options - { weights, categoryAffinity, feedbackStats, limit, skip, query }
   * @returns {Promise<Object>} - { success, items, total, limit, skip }
   */
  async rank(profile, candidates = [], options = {}) {
    this.stats.totalRanked += 1;
    this.stats.totalCandidates += candidates.length;

    try {
      if (!candidates || candidates.length === 0) {
        return { success: true, items: [], total: 0, limit: options.limit || 10, skip: options.skip || 0 };
      }

      const weights = mergeWeights(options.weights);
      const categoryAffinity = options.categoryAffinity || {};
      const feedbackStats = options.feedbackStats || {};
      const query = options.query || '';

      // Deduplicate candidates
      let uniqueCandidates = deduplicate(candidates);

      // Compute similarity scores (embedding-based or query-based)
      let scoredCandidates = [];
      if (query) {
        for (const candidate of uniqueCandidates) {
          const similarity = await similarityEngine.computeQuerySimilarity(query, candidate);
          scoredCandidates.push({ ...candidate, similarity });
        }
      } else {
        scoredCandidates = await similarityEngine.computeBatchSimilarity(profile, uniqueCandidates);
      }

      // Compute individual scores for each candidate
      const fullyScored = scoredCandidates.map((candidate) => {
        const preference = scoringEngine.computePreferenceScore(candidate, categoryAffinity);
        const popularity = scoringEngine.computePopularityScore(candidate);
        const freshness = scoringEngine.computeFreshnessScore(candidate);
        const confidence = scoringEngine.computeConfidenceScore(candidate);
        const feedback = scoringEngine.computeFeedbackScore(
          feedbackStats[candidate.sourceId] || feedbackStats[candidate.title] || {}
        );

        const result = scoringEngine.scoreCandidate(
          {
            ...candidate,
            preference,
            popularity,
            freshness,
            confidence,
            feedback,
          },
          weights
        );

        return {
          ...candidate,
          score: result.score,
          scoreBreakdown: result.scoreBreakdown,
        };
      });

      // Sort by score descending
      fullyScored.sort((a, b) => b.score - a.score);

      // Paginate
      const limit = options.limit || 10;
      const skip = options.skip || 0;
      const paginated = paginate(fullyScored, limit, skip);

      return {
        success: true,
        items: paginated.items,
        total: paginated.total,
        limit: paginated.limit,
        skip: paginated.skip,
        pages: paginated.pages,
      };
    } catch (error) {
      console.error('Ranking Engine - rank error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Rank candidates using pre-computed similarity scores.
   * Useful when similarity is computed externally.
   * @param {Array<Object>} candidates - Candidates with similarity scores
   * @param {Object} options - { weights, categoryAffinity, feedbackStats, limit, skip }
   * @returns {Object} - Ranked results
   */
  rankWithScores(candidates = [], options = {}) {
    this.stats.totalRanked += 1;
    this.stats.totalCandidates += candidates.length;

    try {
      if (!candidates || candidates.length === 0) {
        return { success: true, items: [], total: 0, limit: options.limit || 10, skip: options.skip || 0 };
      }

      const weights = mergeWeights(options.weights);
      const categoryAffinity = options.categoryAffinity || {};
      const feedbackStats = options.feedbackStats || {};

      const uniqueCandidates = deduplicate(candidates);

      const fullyScored = uniqueCandidates.map((candidate) => {
        const preference = scoringEngine.computePreferenceScore(candidate, categoryAffinity);
        const popularity = scoringEngine.computePopularityScore(candidate);
        const freshness = scoringEngine.computeFreshnessScore(candidate);
        const confidence = scoringEngine.computeConfidenceScore(candidate);
        const feedback = scoringEngine.computeFeedbackScore(
          feedbackStats[candidate.sourceId] || feedbackStats[candidate.title] || {}
        );

        const result = scoringEngine.scoreCandidate(
          {
            ...candidate,
            preference,
            popularity,
            freshness,
            confidence,
            feedback,
          },
          weights
        );

        return {
          ...candidate,
          score: result.score,
          scoreBreakdown: result.scoreBreakdown,
        };
      });

      fullyScored.sort((a, b) => b.score - a.score);

      const limit = options.limit || 10;
      const skip = options.skip || 0;
      const paginated = paginate(fullyScored, limit, skip);

      return {
        success: true,
        items: paginated.items,
        total: paginated.total,
        limit: paginated.limit,
        skip: paginated.skip,
        pages: paginated.pages,
      };
    } catch (error) {
      console.error('Ranking Engine - rankWithScores error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get ranking engine statistics
   */
  getStats() {
    return {
      ...this.stats,
      scoring: scoringEngine.getStats(),
      similarity: similarityEngine.getStats(),
    };
  }
}

// Export singleton
const rankingEngine = new RankingEngine();

module.exports = rankingEngine;
module.exports.RankingEngine = RankingEngine;