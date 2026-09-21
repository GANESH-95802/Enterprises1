/**
 * Similarity Engine
 * Computes similarity scores between user profiles and recommendation candidates.
 * Reuses the existing Embedding Client from Phase 1 for semantic similarity.
 * Follows SOLID principles — this module is solely responsible for similarity computation.
 */
const embeddingClient = require('../../clients/embeddingClient');
const { buildCandidateText, buildProfileText, clamp } = require('./recommendationUtils');

class SimilarityEngine {
  constructor() {
    this.stats = {
      totalSimilarityChecks: 0,
      totalEmbeddingCalls: 0,
      fallbackCount: 0,
    };
  }

  /**
   * Compute embedding similarity between a user profile and a candidate.
   * Uses the existing Embedding Client for semantic similarity.
   * Falls back to keyword overlap when embeddings are unavailable.
   * @param {Object} profile - User profile { name, department, position, skills, interests, categories }
   * @param {Object} candidate - Recommendation candidate
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async computeSimilarity(profile, candidate) {
    this.stats.totalSimilarityChecks += 1;

    try {
      const profileText = buildProfileText(profile);
      const candidateText = buildCandidateText(candidate);

      if (!profileText || !candidateText) {
        return this._keywordOverlap(profileText, candidateText);
      }

      // Use the existing Embedding Client for semantic similarity
      const [profileEmbedding, candidateEmbedding] = await Promise.all([
        embeddingClient.generateEmbedding(profileText),
        embeddingClient.generateEmbedding(candidateText),
      ]);

      this.stats.totalEmbeddingCalls += 2;

      if (profileEmbedding.success && candidateEmbedding.success) {
        if (profileEmbedding.fallback || candidateEmbedding.fallback) {
          this.stats.fallbackCount += 1;
        }
        const score = embeddingClient.cosineSimilarity(
          profileEmbedding.embedding,
          candidateEmbedding.embedding
        );
        // Cosine similarity can be negative; normalize to [0, 1]
        return clamp((score + 1) / 2, 0, 1);
      }

      // Fallback to keyword overlap
      this.stats.fallbackCount += 1;
      return this._keywordOverlap(profileText, candidateText);
    } catch (error) {
      console.error('Similarity Engine - compute error:', error.message);
      return 0;
    }
  }

  /**
   * Compute similarity between a query text and a candidate.
   * @param {string} query - Query text
   * @param {Object} candidate - Recommendation candidate
   * @returns {Promise<number>} - Similarity score (0-1)
   */
  async computeQuerySimilarity(query, candidate) {
    this.stats.totalSimilarityChecks += 1;

    try {
      const candidateText = buildCandidateText(candidate);
      if (!query || !candidateText) return 0;

      const [queryEmbedding, candidateEmbedding] = await Promise.all([
        embeddingClient.generateEmbedding(query),
        embeddingClient.generateEmbedding(candidateText),
      ]);

      this.stats.totalEmbeddingCalls += 2;

      if (queryEmbedding.success && candidateEmbedding.success) {
        if (queryEmbedding.fallback || candidateEmbedding.fallback) {
          this.stats.fallbackCount += 1;
        }
        const score = embeddingClient.cosineSimilarity(
          queryEmbedding.embedding,
          candidateEmbedding.embedding
        );
        return clamp((score + 1) / 2, 0, 1);
      }

      this.stats.fallbackCount += 1;
      return this._keywordOverlap(query, candidateText);
    } catch (error) {
      console.error('Similarity Engine - query similarity error:', error.message);
      return 0;
    }
  }

  /**
   * Compute similarity scores for a batch of candidates.
   * @param {Object} profile - User profile
   * @param {Array<Object>} candidates - Candidate items
   * @returns {Promise<Array<Object>>} - Candidates with similarity scores
   */
  async computeBatchSimilarity(profile, candidates = []) {
    const results = [];
    for (const candidate of candidates) {
      const similarity = await this.computeSimilarity(profile, candidate);
      results.push({ ...candidate, similarity });
    }
    return results;
  }

  /**
   * Keyword overlap fallback similarity.
   * Computes Jaccard-like overlap between token sets.
   * @param {string} textA - First text
   * @param {string} textB - Second text
   * @returns {number} - Overlap score (0-1)
   * @private
   */
  _keywordOverlap(textA, textB) {
    if (!textA || !textB) return 0;

    const tokenize = (text) => {
      return new Set(
        text.toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );
    };

    const setA = tokenize(textA);
    const setB = tokenize(textB);

    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    for (const token of setA) {
      if (setB.has(token)) intersection += 1;
    }

    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Get similarity engine statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const similarityEngine = new SimilarityEngine();

module.exports = similarityEngine;
module.exports.SimilarityEngine = SimilarityEngine;