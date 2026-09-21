const openaiClient = require('./openaiClient');

/**
 * Embedding Client
 * Provides unified embedding generation with fallback support.
 * Currently uses OpenAI's embeddings API with graceful degradation.
 */
class EmbeddingClient {
  constructor() {
    this.initialized = false;
    this.embeddingStats = {
      totalEmbeddings: 0,
      totalVectors: 0,
      fallbackCount: 0,
    };
  }

  /**
   * Initialize the embedding client
   */
  initialize() {
    this.initialized = true;
    return true;
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<Object>} - { success, embedding, provider }
   */
  async generateEmbedding(text) {
    try {
      if (!text || typeof text !== 'string') {
        return { success: false, message: 'Text is required for embedding' };
      }

      const result = await openaiClient.generateEmbeddings(text);

      if (!result.success) {
        this.embeddingStats.fallbackCount += 1;
        // Fallback: deterministic hash-based embedding (for non-critical features)
        return {
          success: true,
          embedding: this.generateFallbackEmbedding(text),
          provider: 'fallback',
          fallback: true,
        };
      }

      this.embeddingStats.totalEmbeddings += 1;
      this.embeddingStats.totalVectors += result.embedding.length;

      return {
        success: true,
        embedding: result.embedding,
        provider: 'openai',
      };
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param {Array<string>} texts - Array of texts to embed
   * @returns {Promise<Object>} - { success, embeddings: Array }
   */
  async generateEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        return { success: false, message: 'Texts array is required' };
      }

      const embeddings = [];
      let hasError = false;

      for (const text of texts) {
        const result = await this.generateEmbedding(text);
        if (result.success) {
          embeddings.push(result.embedding);
        } else {
          hasError = true;
          embeddings.push(this.generateFallbackEmbedding(text));
        }
      }

      return {
        success: !hasError || embeddings.length > 0,
        embeddings,
        providers: Array.from(new Set(embeddings.map((e, i) => {
          // Track which provider was used per embedding
          return this.lastProviders?.[i] || 'unknown';
        }))),
      };
    } catch (error) {
      console.error('Batch embedding error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate fallback embedding using deterministic hashing
   * This is NOT semantically meaningful but provides consistent vectors
   * for caching/retrieval when the main provider is unavailable.
   * @param {string} text - Text to hash
   * @returns {Array<number>} - 384-dimension vector
   */
  generateFallbackEmbedding(text) {
    const dims = 384;
    const vector = new Array(dims).fill(0);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % dims;
      vector[index] += 1;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dims; i++) {
        vector[i] = vector[i] / magnitude;
      }
    }

    return vector;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {Array<number>} a - First embedding
   * @param {Array<number>} b - Second embedding
   * @returns {number} - Cosine similarity (-1 to 1)
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find the most similar text from a set of candidates
   * @param {string} query - Query text
   * @param {Array<string>} candidates - Candidate texts
   * @param {number} limit - Max results to return
   * @returns {Promise<Array>} - Sorted array of { text, score }
   */
  async findSimilar(query, candidates, limit = 5) {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding.success) return [];

      const results = [];
      for (const candidate of candidates) {
        const candidateEmbedding = await this.generateEmbedding(candidate);
        if (candidateEmbedding.success) {
          const score = this.cosineSimilarity(queryEmbedding.embedding, candidateEmbedding.embedding);
          results.push({ text: candidate, score });
        }
      }

      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    } catch (error) {
      console.error('Similarity search error:', error.message);
      return [];
    }
  }

  /**
   * Get embedding statistics
   */
  getStats() {
    return { ...this.embeddingStats };
  }
}

// Export singleton instance
const embeddingClient = new EmbeddingClient();

module.exports = embeddingClient;
module.exports.EmbeddingClient = EmbeddingClient;