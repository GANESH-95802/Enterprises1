/**
 * Knowledge Base Tools
 * Tools for querying the enterprise knowledge base from the assistant engine.
 */
const knowledgeBaseManager = require('../../../rag/knowledgeBaseManager');

/**
 * Search the enterprise knowledge base
 */
const searchKnowledgeBase = {
  name: 'search_knowledge_base',
  description: 'Search the enterprise knowledge base for relevant information from ingested documents.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'The search query' },
      limit: { type: 'number', description: 'Max results to return (1-10)' },
      category: { type: 'string', description: 'Filter by document category' },
    },
    required: ['query'],
  },
  handler: async (args = {}, context = {}) => {
    if (!context.userId) {
      return { error: 'User ID not available in context' };
    }
    if (!args.query || !args.query.trim()) {
      return { error: 'Query is required' };
    }

    const result = await knowledgeBaseManager.searchKnowledge(context.userId, args.query.trim(), {
      limit: Math.min(args.limit || 5, 10),
      category: args.category,
    });

    if (!result.success) {
      return { error: result.message || 'Knowledge base search failed' };
    }

    return {
      total: result.data.total,
      results: result.data.results.map((r) => ({
        score: r.score,
        content: r.content,
        documentTitle: r.document?.title || r.metadata?.documentTitle || '',
        category: r.document?.category || r.metadata?.category || '',
      })),
    };
  },
};

/**
 * Get knowledge base statistics
 */
const getKnowledgeStats = {
  name: 'get_knowledge_stats',
  description: 'Get statistics about the enterprise knowledge base including document and embedding counts.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (args = {}, context = {}) => {
    if (!context.userId) {
      return { error: 'User ID not available in context' };
    }

    const result = await knowledgeBaseManager.getStats(context.userId);
    if (!result.success) {
      return { error: result.message || 'Failed to get knowledge base stats' };
    }

    return result.data;
  },
};

module.exports = {
  searchKnowledgeBase,
  getKnowledgeStats,
};