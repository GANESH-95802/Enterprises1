/**
 * Scoring Engine
 * Computes composite scores for recommendation candidates.
 * Combines similarity, preference, popularity, freshness, feedback, and confidence scores.
 * Follows SOLID principles — this module is solely responsible for score computation.
 */
const {
  mergeWeights,
  normalizeScore,
  freshnessScore,
  popularityScore,
  confidenceScore,
  clamp,
} = require('./recommendationUtils');

class ScoringEngine {
  constructor() {
    this.defaultWeights = mergeWeights();
    this.stats = {
      totalScored: 0,
    };
  }

  /**
   * Compute a composite score for a single candidate.
   * @param {Object} candidate - Candidate with similarity, preference, popularity, freshness, feedback, confidence
   * @param {Object} weights - Custom ranking weights
   * @returns {Object} - { score, scoreBreakdown, weights }
   */
  scoreCandidate(candidate = {}, weights = {}) {
    this.stats.totalScored += 1;

    const mergedWeights = mergeWeights(weights);

    // Extract individual scores (all normalized to 0-1)
    const similarity = clamp(candidate.similarity || 0, 0, 1);
    const preference = clamp(candidate.preference || 0, 0, 1);
    const popularity = clamp(candidate.popularity || 0, 0, 1);
    const freshness = clamp(candidate.freshness || 0, 0, 1);
    const feedback = clamp(candidate.feedback || 0, 0, 1);
    const confidence = clamp(candidate.confidence || 0, 0, 1);

    // Compute weighted composite score
    const score =
      (similarity * mergedWeights.similarity) +
      (preference * mergedWeights.preference) +
      (popularity * mergedWeights.popularity) +
      (freshness * mergedWeights.freshness) +
      (feedback * mergedWeights.feedback) +
      (confidence * mergedWeights.confidence);

    return {
      score: clamp(score, 0, 1),
      scoreBreakdown: {
        similarity,
        preference,
        popularity,
        freshness,
        feedback,
        confidence,
      },
      weights: mergedWeights,
    };
  }

  /**
   * Score a batch of candidates.
   * @param {Array<Object>} candidates - Candidate items
   * @param {Object} weights - Custom ranking weights
   * @returns {Array<Object>} - Candidates with scores
   */
  scoreBatch(candidates = [], weights = {}) {
    return candidates.map((candidate) => {
      const result = this.scoreCandidate(candidate, weights);
      return {
        ...candidate,
        score: result.score,
        scoreBreakdown: result.scoreBreakdown,
      };
    });
  }

  /**
   * Compute a preference score from category affinity.
   * @param {Object} candidate - Candidate with category
   * @param {Object} categoryAffinity - Map of category -> affinity score (0-1)
   * @returns {number} - Preference score (0-1)
   */
  computePreferenceScore(candidate = {}, categoryAffinity = {}) {
    const category = candidate.category || 'general';
    const affinity = categoryAffinity[category];
    if (affinity !== undefined) {
      return clamp(affinity, 0, 1);
    }

    // Fallback: check tags against affinity keys
    if (candidate.tags && candidate.tags.length > 0) {
      let best = 0;
      for (const tag of candidate.tags) {
        if (categoryAffinity[tag] !== undefined) {
          best = Math.max(best, categoryAffinity[tag]);
        }
      }
      return clamp(best, 0, 1);
    }

    return 0;
  }

  /**
   * Compute a popularity score from view/click counts.
   * @param {Object} candidate - Candidate with popularityCount
   * @param {number} maxCount - Reference max count
   * @returns {number} - Popularity score (0-1)
   */
  computePopularityScore(candidate = {}, maxCount = 100) {
    const count = candidate.popularityCount || candidate.views || candidate.clicks || 0;
    return popularityScore(count, maxCount);
  }

  /**
   * Compute a freshness score from a candidate date.
   * @param {Object} candidate - Candidate with createdAt or date
   * @param {number} halfLifeDays - Half-life in days
   * @returns {number} - Freshness score (0-1)
   */
  computeFreshnessScore(candidate = {}, halfLifeDays = 30) {
    const date = candidate.createdAt || candidate.date || candidate.updatedAt;
    return freshnessScore(date, halfLifeDays);
  }

  /**
   * Compute a confidence score for a candidate.
   * @param {Object} candidate - Candidate
   * @returns {number} - Confidence score (0-1)
   */
  computeConfidenceScore(candidate = {}) {
    return confidenceScore(candidate);
  }

  /**
   * Compute a feedback score from feedback counts.
   * @param {Object} feedbackStats - { likes, dislikes, clicks, saves, ignores }
   * @returns {number} - Feedback score (0-1)
   */
  computeFeedbackScore(feedbackStats = {}) {
    const likes = feedbackStats.likes || 0;
    const dislikes = feedbackStats.dislikes || 0;
    const clicks = feedbackStats.clicks || 0;
    const saves = feedbackStats.saves || 0;
    const ignores = feedbackStats.ignores || 0;

    const total = likes + dislikes + clicks + saves + ignores;
    if (total === 0) return 0;

    // Positive signals: likes, clicks, saves
    const positive = likes + clicks + saves;
    // Negative signals: dislikes, ignores
    const negative = dislikes + ignores;

    return clamp((positive - negative) / total, 0, 1);
  }

  /**
   * Get scoring engine statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const scoringEngine = new ScoringEngine();

module.exports = scoringEngine;
module.exports.ScoringEngine = ScoringEngine;