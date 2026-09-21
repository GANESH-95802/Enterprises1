const vectorStore = require('./vectorStore');
const contextManager = require('../orchestrator/contextManager');
const AiKnowledgeDocument = require('../../../models/AiKnowledgeDocument');

/**
 * RetrievalService
 * Provides RAG retrieval for the Assistant Engine and direct API consumers.
 * Builds context from semantic search results and integrates with the
 * existing Context Manager for augmented responses.
 * Follows SOLID principles — this module is solely responsible for retrieval.
 */
class RetrievalService {
  constructor() {
    this.maxContextChunks = parseInt(process.env.KNOWLEDGE_MAX_CONTEXT_CHUNKS || '5', 10);
    this.maxContextLength = parseInt(process.env.KNOWLEDGE_MAX_CONTEXT_LENGTH || '4000', 10);
  }

  /**
   * Retrieve relevant knowledge chunks for a query and format as context.
   * @param {string} userId - User ID
   * @param {string} query - User query
   * @param {Object} options - { limit, category, minScore, documentId, format }
   * @returns {Promise<Object>} - { success, results, context, augmentedContext }
   */
  async retrieve(userId, query, options = {}) {
    try {
      const limit = Math.min(options.limit || this.maxContextChunks, 10);
      const result = await vectorStore.search(userId, query, {
        limit,
        category: options.category,
        minScore: options.minScore,
        documentId: options.documentId,
      });

      if (!result.success) {
        return { success: false, message: result.message };
      }

      if (result.results.length === 0) {
        return {
          success: true,
          results: [],
          context: '',
          hasKnowledge: false,
        };
      }

      // Format results as prompt context
      const contextParts = result.results.map((item, index) => {
        const title = item.metadata?.documentTitle || 'Knowledge Base Document';
        const category = item.metadata?.category || 'general';
        return `[Source ${index + 1}] (${title}, ${category})\n${item.content}`;
      });

      let context = contextParts.join('\n\n');
      if (context.length > this.maxContextLength) {
        context = context.substring(0, this.maxContextLength) + '\n... (context truncated)';
      }

      return {
        success: true,
        results: result.results,
        context,
        hasKnowledge: true,
        provider: result.provider,
      };
    } catch (error) {
      console.error('Retrieval service - retrieve error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Build an augmented context prompt merging enterprise context with knowledge chunks.
   * Uses the existing Context Manager for enterprise context.
   * @param {string} userId - User ID
   * @param {string} query - User query
   * @param {Object} options - { limit, category, minScore, includeEnterprise }
   * @returns {Promise<Object>} - { success, context, results, userContext, enterpriseContext }
   */
  async buildAugmentedContext(userId, query, options = {}) {
    try {
      const [retrievalResult, queryContext] = await Promise.all([
        this.retrieve(userId, query, options),
        options.includeEnterprise !== false
          ? contextManager.buildQueryContext(userId, { type: 'assistant-retrieval' })
          : Promise.resolve(null),
      ]);

      if (!retrievalResult.success) {
        return { success: false, message: retrievalResult.message };
      }

      const parts = [];

      // Add enterprise context from existing Context Manager
      if (queryContext) {
        const enterpriseText = contextManager.contextToPrompt(queryContext);
        if (enterpriseText) {
          parts.push(`ENTERPRISE CONTEXT:\n${enterpriseText}`);
        }
      }

      // Add knowledge base context
      if (retrievalResult.hasKnowledge) {
        parts.push(`KNOWLEDGE BASE (Retrieved from enterprise documents):\n${retrievalResult.context}`);
      }

      return {
        success: true,
        context: parts.join('\n\n'),
        results: retrievalResult.results,
        hasKnowledge: retrievalResult.hasKnowledge,
        provider: retrievalResult.provider,
        userContext: queryContext?.user || null,
        enterpriseContext: queryContext?.enterprise || null,
      };
    } catch (error) {
      console.error('Retrieval service - augment error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get citation metadata from the retrieval results
   * @param {Array<Object>} results - Retrieval results
   * @returns {Array<Object>} - Citations
   */
  buildCitations(results = []) {
    return results.map((r, index) => ({
      reference: index + 1,
      documentId: r.sourceId ? String(r.sourceId) : null,
      documentTitle: r.metadata?.documentTitle || '',
      category: r.metadata?.category || '',
      score: r.score || 0,
      snippet: (r.content || '').substring(0, 200),
    }));
  }

  /**
   * Get document title from metadata for enriched responses
   * @param {Array<Object>} results - Retrieval results
   * @returns {Array<string>} - Unique document titles
   */
  getSourceTitles(results = []) {
    const titles = new Set();
    for (const r of results) {
      if (r.metadata?.documentTitle) {
        titles.add(r.metadata.documentTitle);
      }
    }
    return Array.from(titles);
  }
}

// Export singleton
const retrievalService = new RetrievalService();

module.exports = retrievalService;
module.exports.RetrievalService = RetrievalService;