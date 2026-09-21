const embeddingClient = require('../clients/embeddingClient');

/**
 * RAGEmbeddingService
 * Generates and persists embeddings for knowledge base chunks.
 * Reuses the existing Embedding Client from Phase 1.
 * Follows SOLID principles — this module is solely responsible for embedding generation/persistence.
 */
class RAGEmbeddingService {
  constructor() {
    this.stats = {
      totalEmbedded: 0,
      totalFailures: 0,
      fallbackCount: 0,
    };
  }

  /**
   * Generate an embedding for a single text using the existing Embedding Client
   * @param {string} text - Text to embed
   * @returns {Promise<Object>} - { success, embedding, provider, fallback }
   */
  async generateEmbedding(text) {
    try {
      const result = await embeddingClient.generateEmbedding(text);
      if (result.success) {
        this.stats.totalEmbedded += 1;
        if (result.fallback) this.stats.fallbackCount += 1;
        return {
          success: true,
          embedding: result.embedding,
          provider: result.provider || 'unknown',
          fallback: result.fallback || false,
        };
      }
      this.stats.totalFailures += 1;
      return { success: false, message: result.message };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('RAG embedding service - generate error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Persist embeddings for document chunks into the AiEmbedding model.
   * @param {string} userId - User ID
   * @param {string} documentId - AiKnowledgeDocument ID
   * @param {string} documentTitle - Document title
   * @param {Array<Object>} chunks - Array of { content, index }
   * @param {Object} metadata - Additional metadata (category, tags, etc.)
   * @returns {Promise<Object>} - { success, count, embeddings }
   */
  async persistDocumentEmbeddings(userId, documentId, documentTitle, chunks, metadata = {}) {
    try {
      const results = [];
      const errors = [];

      for (const chunk of chunks) {
        const embeddingResult = await this.generateEmbedding(chunk.content);

        if (!embeddingResult.success) {
          errors.push({ index: chunk.index, message: embeddingResult.message });
          continue;
        }

        const saved = await this._saveEmbedding({
          userId,
          content: chunk.content,
          embedding: embeddingResult.embedding,
          provider: embeddingResult.provider,
          source: 'document',
          sourceId: documentId,
          metadata: {
            ...metadata,
            documentId: documentId.toString(),
            documentTitle,
            chunkIndex: chunk.index,
            startOffset: chunk.startOffset || 0,
            endOffset: chunk.endOffset || 0,
            type: 'knowledge-base',
          },
          dimension: embeddingResult.embedding.length,
        });

        if (saved.success) {
          results.push({ index: chunk.index, id: saved.id });
        } else {
          errors.push({ index: chunk.index, message: saved.message });
        }
      }

      return {
        success: results.length > 0,
        count: results.length,
        totalChunks: chunks.length,
        results,
        errors,
      };
    } catch (error) {
      console.error('RAG embedding service - persist error:', error.message);
      return { success: false, count: 0, message: error.message };
    }
  }

  /**
   * Save a single embedding record to the AiEmbedding model
   * @param {Object} data - Embedding data
   * @returns {Promise<Object>} - Save result
   */
  async _saveEmbedding({ userId, content, embedding, provider, source, sourceId, metadata, dimension }) {
    const AiEmbedding = require('../../../models/AiEmbedding');
    const crypto = require('crypto');

    try {
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');

      const record = await AiEmbedding.create({
        user: userId,
        content,
        contentHash: `${documentHashPrefix(sourceId)}:${contentHash}`,
        embedding,
        dimension,
        provider,
        source,
        sourceId,
        metadata,
      });

      return { success: true, id: record._id };
    } catch (error) {
      // Handle duplicate key (same chunk already embedded)
      if (error.code === 11000) {
        return { success: false, message: 'Duplicate embedding for this chunk' };
      }
      console.error('RAG embedding service - save embedding error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Remove all embeddings for a document
   * @param {string} documentId - AiKnowledgeDocument ID
   * @returns {Promise<Object>} - { success, deleted }
   */
  async removeDocumentEmbeddings(documentId) {
    const AiEmbedding = require('../../../models/AiEmbedding');

    try {
      const result = await AiEmbedding.deleteMany({
        source: 'document',
        sourceId: documentId,
        'metadata.type': 'knowledge-base',
      });
      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      console.error('RAG embedding service - remove error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get embedding statistics
   */
  getStats() {
    return {
      ...this.stats,
      client: embeddingClient.getStats(),
    };
  }
}

/**
 * Build a content hash prefix from a document ID to keep unique-per-document
 * @param {ObjectId|string} sourceId - Document ID
 * @returns {string} - Short hash prefix
 */
function documentHashPrefix(sourceId) {
  return String(sourceId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-24);
}

// Export singleton
const ragEmbeddingService = new RAGEmbeddingService();

module.exports = ragEmbeddingService;
module.exports.RAGEmbeddingService = RAGEmbeddingService;