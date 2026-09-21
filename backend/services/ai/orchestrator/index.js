const queryRouter = require('./queryRouter');
const contextManager = require('./contextManager');
const memoryManager = require('./memoryManager');
const responseBuilder = require('./responseBuilder');
const geminiClient = require('../clients/geminiClient');
const openaiClient = require('../clients/openaiClient');

/**
 * AI Orchestrator
 * Coordinates the full AI request flow:
 * User Request → Query Router → Context Manager → AI Provider → Response Builder
 */
class AIOrchestrator {
  constructor() {
    this.initialized = false;
    this.defaultSessionId = 'default';
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
    };
  }

  /**
   * Initialize all AI components
   */
  initialize() {
    geminiClient.initialize();
    openaiClient.initialize();
    this.initialized = true;
    console.log('AI Orchestrator initialized');
    return true;
  }

  /**
   * Process a general AI query
   * @param {string} userId - User ID
   * @param {string} query - User query
   * @param {Object} options - { sessionId, provider, parseJSON, type, useCache }
   * @returns {Promise<Object>} - Standardized response
   */
  async processQuery(userId, query, options = {}) {
    this.stats.totalQueries += 1;

    try {
      if (!this.initialized) {
        this.initialize();
      }

      const sessionId = options.sessionId || this.defaultSessionId;
      const useCache = options.useCache !== false;

      // 1. Check cache first
      if (useCache) {
        const cacheResult = await contextManager.loadCachedContext(query, userId);
        if (cacheResult.hit) {
          this.stats.cacheHits += 1;
          return responseBuilder.buildCached(cacheResult.data, {
            cacheKey: cacheResult.key,
            expiresAt: cacheResult.data?.expiresAt,
          });
        }
        this.stats.cacheMisses += 1;
      }

      // 2. Build context
      const context = await contextManager.buildQueryContext(userId, {
        type: options.type || 'general',
      });
      const contextText = contextManager.contextToPrompt(context);

      // 3. Load conversation memory
      const history = await memoryManager.getContextWindow(userId, sessionId);

      // 4. Build the full prompt with context and history
      const prompt = this.buildPrompt(query, contextText, history, options);

      // 5. Route to AI provider
      const result = await queryRouter.routeTextGeneration(prompt, {
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      // 6. Save to memory
      await memoryManager.saveMessage({
        userId,
        role: 'user',
        content: query,
        sessionId,
        metadata: { contextSize: contextText.length },
      });

      if (result.success) {
        await memoryManager.saveMessage({
          userId,
          role: 'assistant',
          content: result.text || result.message || '',
          sessionId,
          metadata: {
            provider: result.provider,
            model: result.model,
            usage: result.usage,
          },
        });
      }

      // 7. Cache the response
      if (useCache && result.success) {
        const cacheKey = contextManager.generateCacheKey(query, userId);
        await contextManager.saveToCache(cacheKey, userId, result);
      }

      // 8. Build and return response
      return responseBuilder.buildFromRouterResult(result, {
        parseJSON: options.parseJSON,
        cacheHit: false,
        contextSize: contextText.length,
      });
    } catch (error) {
      this.stats.errors += 1;
      console.error('AI Orchestrator - query error:', error.message);
      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Process a chat message with context
   * @param {string} userId - User ID
   * @param {string} message - User message
   * @param {Object} options - { sessionId, conversationHistory, provider }
   * @returns {Promise<Object>} - Chat response
   */
  async processChat(userId, message, options = {}) {
    this.stats.totalQueries += 1;

    try {
      if (!this.initialized) {
        this.initialize();
      }

      const sessionId = options.sessionId || this.defaultSessionId;

      // Build context
      const context = await contextManager.buildQueryContext(userId, {
        type: 'chat',
      });
      const contextText = contextManager.contextToPrompt(context);

      // Build messages array
      const systemMessage = {
        role: 'system',
        content: `You are an AI Enterprise Assistant for AI Enterprise Hub. Help users with business analytics, document generation, skill development, compliance, and enterprise operations.\n\n${contextText}`,
      };

      // Use provided conversation history or load from memory
      let history = options.conversationHistory || [];
      if (!options.conversationHistory) {
        history = await memoryManager.getContextWindow(userId, sessionId);
      }

      const messages = [
        systemMessage,
        ...history.slice(-10),
        { role: 'user', content: message },
      ];

      // Route to chat provider
      const result = await queryRouter.routeChatCompletion(messages, {
        provider: options.provider,
        model: options.model,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1500,
      });

      // Save messages to memory
      await memoryManager.saveMessage({
        userId,
        role: 'user',
        content: message,
        sessionId,
      });

      if (result.success) {
        await memoryManager.saveMessage({
          userId,
          role: 'assistant',
          content: result.text || result.message || '',
          sessionId,
          metadata: {
            provider: result.provider,
            model: result.model,
            usage: result.usage,
          },
        });
      }

      return responseBuilder.buildFromRouterResult(result, {
        contextSize: contextText.length,
      });
    } catch (error) {
      this.stats.errors += 1;
      console.error('AI Orchestrator - chat error:', error.message);
      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Get conversation history
   * @param {string} userId - User ID
   * @param {Object} options - { sessionId, limit }
   * @returns {Promise<Object>} - History response
   */
  async getHistory(userId, options = {}) {
    try {
      const messages = await memoryManager.getConversationHistory(userId, {
        sessionId: options.sessionId,
        limit: options.limit,
      });
      return responseBuilder.buildHistory(messages, {
        sessionId: options.sessionId,
      });
    } catch (error) {
      console.error('AI Orchestrator - history error:', error.message);
      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Get AI context for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Context response
   */
  async getContext(userId) {
    try {
      const context = await contextManager.buildQueryContext(userId, {
        type: 'context',
      });
      return responseBuilder.buildContext(context);
    } catch (error) {
      console.error('AI Orchestrator - context error:', error.message);
      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Submit feedback on an AI response
   * @param {string} userId - User ID
   * @param {Object} data - { messageId, rating, feedback }
   * @returns {Promise<Object>} - Feedback response
   */
  async submitFeedback(userId, data) {
    try {
      const result = await memoryManager.rateResponse(
        data.messageId,
        userId,
        data.rating,
        data.feedback || ''
      );
      return responseBuilder.buildFeedback(result);
    } catch (error) {
      console.error('AI Orchestrator - feedback error:', error.message);
      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Clear conversation history
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  async clearConversation(userId, sessionId) {
    return memoryManager.clearConversation(userId, sessionId);
  }

  /**
   * Build a prompt with context and history
   */
  buildPrompt(query, contextText, history = [], options = {}) {
    const parts = [];

    if (contextText) {
      parts.push(`CONTEXT:\n${contextText}`);
    }

    if (history.length > 0) {
      parts.push(`CONVERSATION HISTORY:`);
      for (const msg of history) {
        const role = msg.role === 'assistant' ? 'Assistant' : 'User';
        parts.push(`${role}: ${msg.content}`);
      }
    }

    parts.push(`QUERY:\n${query}`);

    if (options.system) {
      parts.unshift(`SYSTEM:\n${options.system}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Get orchestrator statistics
   */
  getStats() {
    return {
      ...this.stats,
      router: queryRouter.getStats(),
      memoryCache: contextManager.getStats(),
    };
  }

  /**
   * Get token usage across all providers
   */
  getTokenUsage() {
    return {
      gemini: geminiClient.getTokenUsage(),
      openai: openaiClient.getTokenUsage(),
    };
  }

  /**
   * Check if orchestrator is ready
   */
  isReady() {
    return this.initialized || geminiClient.isAvailable() || openaiClient.isAvailable();
  }
}

// Export singleton
const orchestrator = new AIOrchestrator();

module.exports = orchestrator;
module.exports.AIOrchestrator = AIOrchestrator;