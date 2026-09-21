const OpenAI = require('openai');

/**
 * OpenAI AI Client
 * Preserves existing functionality from openaiService.js while adding:
 * - Provider fallback support
 * - Token usage tracking
 * - Standardized error handling
 */
class OpenAIClient {
  constructor() {
    this.openai = null;
    this.apiKeys = [];
    this.currentKeyIndex = 0;
    this.invalidKeys = new Set();
    this.initialized = false;
    this.tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
    };
  }

  /**
   * Parse comma-separated API keys for rotation
   */
  parseApiKeys() {
    const primaryKey = process.env.OPENAI_API_KEY;
    const multiKeys = process.env.OPENAI_API_KEYS;

    const keys = [];
    if (multiKeys) {
      keys.push(...multiKeys.split(',').map((k) => k.trim()).filter(Boolean));
    }
    if (primaryKey && !keys.includes(primaryKey)) {
      keys.push(primaryKey);
    }
    return keys;
  }

  /**
   * Initialize the OpenAI client
   */
  initialize() {
    this.apiKeys = this.parseApiKeys();
    if (this.apiKeys.length > 0) {
      this.openai = new OpenAI({ apiKey: this.apiKeys[0] });
      this.initialized = true;
      return true;
    }
    console.warn('OpenAI API key not configured. OpenAI features disabled.');
    return false;
  }

  /**
   * Rotate to next available API key
   */
  rotateKey() {
    if (this.apiKeys.length <= 1) return false;
    const startIndex = this.currentKeyIndex;
    do {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      if (!this.invalidKeys.has(this.currentKeyIndex)) {
        this.openai = new OpenAI({ apiKey: this.apiKeys[this.currentKeyIndex] });
        console.log(`Rotated to OpenAI API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
        return true;
      }
    } while (this.currentKeyIndex !== startIndex);
    return false;
  }

  /**
   * Mark current key as invalid (e.g., 401 auth error)
   */
  markKeyInvalid() {
    this.invalidKeys.add(this.currentKeyIndex);
    console.warn(`OpenAI API key ${this.currentKeyIndex + 1} marked as invalid`);
    return this.rotateKey();
  }

  /**
   * Get the OpenAI client instance
   */
  getClient() {
    if (!this.openai) {
      if (!this.initialize()) return null;
    }
    return this.openai;
  }

  /**
   * Execute with automatic key rotation on rate limit (429) or auth (401) errors
   */
  async executeWithRetry(fn) {
    try {
      return await fn();
    } catch (error) {
      const status = error?.status || error?.response?.status;
      if (status === 429 || status === 401) {
        if (status === 401) {
          this.markKeyInvalid();
        } else {
          this.rotateKey();
        }
        try {
          return await fn();
        } catch (retryError) {
          console.error('OpenAI retry failed:', retryError.message);
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Track token usage from a response
   */
  trackUsage(usage) {
    if (!usage) return;
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    this.tokenUsage.promptTokens += promptTokens;
    this.tokenUsage.completionTokens += completionTokens;
    this.tokenUsage.totalTokens += promptTokens + completionTokens;
    this.tokenUsage.requestCount += 1;
  }

  /**
   * Get current token usage statistics
   */
  getTokenUsage() {
    return { ...this.tokenUsage };
  }

  /**
   * Reset token usage counters
   */
  resetTokenUsage() {
    this.tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestCount: 0,
    };
  }

  /**
   * Check if the client is available
   */
  isAvailable() {
    return this.initialized && this.openai !== null;
  }

  /**
   * Chat completion
   * @param {Array} messages - Chat messages
   * @param {Object} options - Model options
   * @returns {Promise<Object>} - Response with message and usage
   */
  async chatCompletion(messages, options = {}) {
    try {
      const client = this.getClient();
      if (!client) return this.generateMockChatResponse(messages);

      const completion = await this.executeWithRetry(() =>
        client.chat.completions.create({
          model: options.model || 'gpt-3.5-turbo',
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
        })
      );

      if (!completion) return this.generateMockChatResponse(messages);

      // Track usage
      if (completion.usage) {
        this.trackUsage(completion.usage);
      }

      return {
        success: true,
        message: completion.choices[0].message.content,
        provider: 'openai',
        model: options.model || 'gpt-3.5-turbo',
        usage: completion.usage,
      };
    } catch (error) {
      console.error('OpenAI chat error:', error.message);
      return this.generateMockChatResponse(messages);
    }
  }

  /**
   * Generate embeddings
   * @param {string} text - Text to embed
   * @returns {Promise<Object>} - Response with embedding
   */
  async generateEmbeddings(text) {
    try {
      const client = this.getClient();
      if (!client) return { success: false, message: 'OpenAI not configured' };

      const response = await this.executeWithRetry(() =>
        client.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text,
        })
      );

      if (!response) return { success: false, message: 'Embedding generation failed' };

      return { success: true, embedding: response.data[0].embedding };
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Analyze sentiment
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    try {
      const client = this.getClient();
      if (!client) {
        return {
          sentiment: 'neutral',
          score: 0.5,
          explanation: 'Mock sentiment analysis',
        };
      }

      const completion = await this.executeWithRetry(() =>
        client.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a sentiment analysis AI. Analyze the sentiment of the given text and return a JSON with: sentiment (positive/negative/neutral), score (0-1), and explanation.',
            },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
        })
      );

      if (!completion) {
        return { sentiment: 'neutral', score: 0.5, explanation: 'Could not get AI response' };
      }

      // Track usage
      if (completion.usage) {
        this.trackUsage(completion.usage);
      }

      const response = completion.choices[0].message.content;
      try {
        return JSON.parse(response.replace(/```json|```/g, '').trim());
      } catch {
        return { sentiment: 'neutral', score: 0.5, explanation: 'Could not parse AI response' };
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error.message);
      return { sentiment: 'neutral', score: 0.5, explanation: error.message };
    }
  }

  /**
   * Mock chat response for when OpenAI is not available
   */
  generateMockChatResponse(messages) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    return {
      success: true,
      message: `I understand you're asking about: "${lastMessage.substring(0, 100)}". As an AI assistant for AI Enterprise Hub, I can help with business analytics, document generation, skill evaluation, and more. Please configure your OpenAI API key for full AI capabilities.`,
      provider: 'mock',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }
}

// Export singleton instance for backward compatibility
const openaiClient = new OpenAIClient();

module.exports = openaiClient;
module.exports.OpenAIClient = OpenAIClient;