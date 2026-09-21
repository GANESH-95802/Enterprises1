const geminiClient = require('../clients/geminiClient');
const openaiClient = require('../clients/openaiClient');

/**
 * Query Router
 * Routes AI queries to the appropriate provider based on:
 * - Provider availability
 * - Query type (text, image, chat, embeddings)
 * - Provider precedence configuration
 * - Automatic fallback when a provider fails
 */
class QueryRouter {
  constructor() {
    this.providerPrecedence = process.env.AI_PROVIDER_PRECEDENCE
      ? process.env.AI_PROVIDER_PRECEDENCE.split(',').map((p) => p.trim())
      : ['gemini', 'openai'];
    this.stats = {
      totalRouted: 0,
      gemini: 0,
      openai: 0,
      fallbacks: 0,
      failures: 0,
    };
  }

  /**
   * Set provider precedence order
   * @param {Array<string>} providers - e.g., ['gemini', 'openai']
   */
  setProviderPrecedence(providers) {
    if (Array.isArray(providers) && providers.length > 0) {
      this.providerPrecedence = providers;
    }
  }

  /**
   * Check which providers are available
   */
  getAvailableProviders() {
    const available = [];
    if (geminiClient.isAvailable()) available.push('gemini');
    if (openaiClient.isAvailable()) available.push('openai');
    return available;
  }

  /**
   * Route a text generation query
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Options including preferred provider
   * @returns {Promise<Object>} - Response from the chosen provider
   */
  async routeTextGeneration(prompt, options = {}) {
    this.stats.totalRouted += 1;

    const preferredProvider = options.provider || null;
    const orderedProviders = preferredProvider && this.providerPrecedence.includes(preferredProvider)
      ? [preferredProvider, ...this.providerPrecedence.filter((p) => p !== preferredProvider)]
      : this.providerPrecedence;

    const availableProviders = new Set(this.getAvailableProviders());

    for (const provider of orderedProviders) {
      if (!availableProviders.has(provider)) continue;

      try {
        let result;
        if (provider === 'gemini') {
          result = await geminiClient.generateContent(prompt, options);
        } else if (provider === 'openai') {
          result = await openaiClient.chatCompletion(
            [{ role: 'user', content: prompt }],
            options
          );
        }

        if (result && result.success) {
          this.stats[provider] += 1;
          return {
            ...result,
            provider,
            routed: true,
          };
        }

        // Provider failed — try fallback
        this.stats.fallbacks += 1;
        console.warn(`AI provider '${provider}' failed, trying next provider...`);
      } catch (error) {
        this.stats.fallbacks += 1;
        console.error(`AI provider '${provider}' error:`, error.message);
      }
    }

    // All providers failed
    this.stats.failures += 1;
    return {
      success: false,
      message: 'All AI providers failed to generate a response',
      fallback: true,
    };
  }

  /**
   * Route a chat completion query
   * @param {Array<Object>} messages - Chat messages
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Response from the chosen provider
   */
  async routeChatCompletion(messages, options = {}) {
    this.stats.totalRouted += 1;

    const preferredProvider = options.provider || 'openai'; // Chat defaults to OpenAI
    const orderedProviders = this.providerPrecedence.includes(preferredProvider)
      ? [preferredProvider, ...this.providerPrecedence.filter((p) => p !== preferredProvider)]
      : this.providerPrecedence;

    const availableProviders = new Set(this.getAvailableProviders());
    const chatCompatibleProviders = ['openai', 'gemini'];

    for (const provider of orderedProviders) {
      if (!chatCompatibleProviders.includes(provider)) continue;
      if (!availableProviders.has(provider)) continue;

      try {
        let result;
        if (provider === 'openai') {
          result = await openaiClient.chatCompletion(messages, options);
        } else if (provider === 'gemini') {
          // Convert chat messages to a Gemini-compatible prompt
          const prompt = messages
            .map((m) => `${m.role === 'system' ? 'System' : m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
            .join('\n\n');
          result = await geminiClient.generateContent(prompt, options);
        }

        if (result && result.success) {
          this.stats[provider] += 1;
          return {
            ...result,
            provider,
            routed: true,
          };
        }

        this.stats.fallbacks += 1;
        console.warn(`AI chat provider '${provider}' failed, trying next provider...`);
      } catch (error) {
        this.stats.fallbacks += 1;
        console.error(`AI chat provider '${provider}' error:`, error.message);
      }
    }

    this.stats.failures += 1;
    return {
      success: false,
      message: 'All AI providers failed to handle chat request',
      fallback: true,
    };
  }

  /**
   * Route an image analysis query (Gemini Vision only)
   * @param {string} imageBase64 - Base64 encoded image
   * @param {string} mimeType - Image MIME type
   * @param {string} prompt - Analysis prompt
   * @returns {Promise<Object>} - Response
   */
  async routeImageAnalysis(imageBase64, mimeType, prompt) {
    this.stats.totalRouted += 1;

    try {
      if (geminiClient.isAvailable()) {
        const result = await geminiClient.generateContentWithImage(imageBase64, mimeType, prompt);
        if (result.success) {
          this.stats.gemini += 1;
          return { ...result, provider: 'gemini', routed: true };
        }
      }

      this.stats.fallbacks += 1;
      this.stats.failures += 1;
      return {
        success: false,
        message: 'Image analysis failed: Gemini vision unavailable',
        fallback: true,
      };
    } catch (error) {
      this.stats.failures += 1;
      console.error('Image analysis routing error:', error.message);
      return {
        success: false,
        message: error.message,
        fallback: true,
      };
    }
  }

  /**
   * Route to a specific provider by name
   * @param {string} provider - 'gemini' or 'openai'
   * @param {string} prompt - Prompt
   * @param {Object} options - Options
   */
  async routeToProvider(provider, prompt, options = {}) {
    this.stats.totalRouted += 1;

    try {
      if (provider === 'gemini') {
        const result = await geminiClient.generateContent(prompt, options);
        if (result.success) {
          this.stats.gemini += 1;
          return { ...result, provider: 'gemini', routed: true };
        }
        return result;
      }

      if (provider === 'openai') {
        const result = await openaiClient.chatCompletion(
          [{ role: 'user', content: prompt }],
          options
        );
        if (result.success) {
          this.stats.openai += 1;
          return { ...result, provider: 'openai', routed: true };
        }
        return result;
      }

      return { success: false, message: `Unknown provider: ${provider}` };
    } catch (error) {
      this.stats.failures += 1;
      return { success: false, message: error.message };
    }
  }

  /**
   * Get routing statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset routing statistics
   */
  resetStats() {
    this.stats = {
      totalRouted: 0,
      gemini: 0,
      openai: 0,
      fallbacks: 0,
      failures: 0,
    };
  }
}

// Export singleton
const queryRouter = new QueryRouter();

module.exports = queryRouter;
module.exports.QueryRouter = QueryRouter;