const AiEmbedding = require('../../../models/AiEmbedding');
const embeddingClient = require('../clients/embeddingClient');

/**
 * VectorStore
 * Manages vector search over the AiEmbedding collection.
 * Implements semantic similarity search using cosine similarity.
 * Follows SOLID principles — this module is solely responsible for vector search.
 */
class VectorStore {
  constructor() {
    this.maxCandidates = parseInt(process.env.KNOWLEDGE_MAX_CANDIDATES || '100', 10);
    this.minScore = parseFloat(process.env.KNOWLEDGE_MIN_SCORE || '0.25', 10);
  }

  /**
   * Semantic similarity search over stored document embeddings.
   * @param {string} userId - User ID
   * @param {string} query - Query text
   * @param {Object} options - { limit, category, minScore, documentId }
   * @returns {Promise<Object>} - { success, results, provider }
   */
  async search(userId, query, options = {}) {
    try {
      const limit = Math.min(options.limit || 5, 20);
      const minScore = options.minScore !== undefined ? options.minScore : this.minScore;

      // Generate query embedding using existing Embedding Client
      const queryEmbedding = await embeddingClient.generateEmbedding(query);
      if (!queryEmbedding.success) {
        return { success: false, message: queryEmbedding.message || 'Failed to generate query embedding' };
      }

      // Build the candidate query
      const dbQuery = {
        user: userId,
        source: 'document',
        'metadata.type': 'knowledge-base',
      };

      if (options.documentId) {
        dbQuery.sourceId = options.documentId;
      }

      if (options.category) {
        dbQuery['metadata.category'] = options.category;
      }

      // Load candidate embeddings
      const candidates = await AiEmbedding.find(dbQuery)
        .select('content embedding metadata sourceId createdAt')
        .sort({ createdAt: -1 })
        .limit(this.maxCandidates);

      if (candidates.length === 0) {
        return { success: true, results: [], total: 0, provider: queryEmbedding.provider };
      }

      // Compute cosine similarity for each candidate
      const scored = candidates
        .map((candidate) => {
          const score = embeddingClient.cosineSimilarity(queryEmbedding.embedding, candidate.embedding);
          return {
            id: candidate._id,
            content: candidate.content,
            score,
            metadata: candidate.metadata || {},
            sourceId: candidate.sourceId,
            createdAt: candidate.createdAt,
          };
        })
        .filter((item) => item.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        success: true,
        results: scored,
        total: scored.length,
        provider: queryEmbedding.provider,
        queryEmbeddingDimension: queryEmbedding.embedding.length,
      };
    } catch (error) {
      console.error('Vector store - search error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get stored embedding count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of knowledge-base embeddings
   */
  async countEmbeddings(userId) {
    try {
      return await AiEmbedding.countDocuments({
        user: userId,
        source: 'document',
        'metadata.type': 'knowledge-base',
      });
    } catch (error) {
      console.error('Vector store - count error:', error.message);
      return 0;
    }
  }

  /**
   * Get estimated embedding stats
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Stats object
   */
  async getStats(userId) {
    try {
      const [total, byProvider] = await Promise.all([
        this.countEmbeddings(userId),
        AiEmbedding.aggregate([
          { $match: { user: userId, source: 'document', 'metadata.type': 'knowledge-base' } },
          { $group: { _id: '$provider', count: { $sum: 1 } } },
        ]),
      ]);

      return {
        totalEmbeddings: total,
        byProvider: byProvider.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('Vector store - stats error:', error.message);
      return { totalEmbeddings: 0, byProvider: {} };
    }
  }
}

// Export singleton
const vectorStore = new VectorStore();

module.exports = vectorStore;
module.exports.VectorStore = VectorStore;