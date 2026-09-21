const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Client
 * Preserves existing functionality from aiService.js while adding:
 * - Provider fallback support
 * - Token usage tracking
 * - Standardized error handling
 */
class GeminiClient {
  constructor() {
    this.genAI = null;
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
    const primaryKey = process.env.GEMINI_API_KEY;
    const multiKeys = process.env.GEMINI_API_KEYS;

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
   * Initialize the Gemini client
   */
  initialize() {
    this.apiKeys = this.parseApiKeys();
    if (this.apiKeys.length > 0) {
      this.genAI = new GoogleGenerativeAI(this.apiKeys[0]);
      this.initialized = true;
      return true;
    }
    console.warn('Gemini API key not configured. AI features will return mock data.');
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
        this.genAI = new GoogleGenerativeAI(this.apiKeys[this.currentKeyIndex]);
        console.log(`Rotated to Gemini API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
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
    console.warn(`Gemini API key ${this.currentKeyIndex + 1} marked as invalid`);
    return this.rotateKey();
  }

  /**
   * Get the generative model
   */
  getModel(modelName = 'gemini-pro') {
    if (!this.genAI) {
      if (!this.initialize()) {
        return null;
      }
    }
    return this.genAI.getGenerativeModel({ model: modelName });
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
        // Retry once with new key
        try {
          return await fn();
        } catch (retryError) {
          console.error('Gemini retry failed:', retryError.message);
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * Track token usage from a response
   */
  trackUsage(usageMetadata) {
    if (!usageMetadata) return;
    const promptTokens = usageMetadata.promptTokenCount || 0;
    const completionTokens = usageMetadata.candidatesTokenCount || 0;
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
    return this.initialized && this.genAI !== null;
  }

  /**
   * Generate content with the Gemini model
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Model options
   * @returns {Promise<Object>} - Response with text and usage
   */
  async generateContent(prompt, options = {}) {
    try {
      const model = this.getModel(options.model || 'gemini-pro');
      if (!model) {
        return { success: false, message: 'Gemini not configured', fallback: true };
      }

      const result = await this.executeWithRetry(() => model.generateContent(prompt));
      if (!result) {
        return { success: false, message: 'Gemini request failed', fallback: true };
      }

      const response = await result.response;
      const text = response.text();

      // Track usage if available
      if (response.usageMetadata) {
        this.trackUsage(response.usageMetadata);
      }

      return {
        success: true,
        text,
        provider: 'gemini',
        model: options.model || 'gemini-pro',
        usage: response.usageMetadata || null,
      };
    } catch (error) {
      console.error('Gemini generateContent error:', error.message);
      return {
        success: false,
        message: error.message,
        fallback: true,
        error,
      };
    }
  }

  /**
   * Generate content with image input (vision)
   * @param {string} imageBase64 - Base64 encoded image
   * @param {string} mimeType - Image MIME type
   * @param {string} prompt - The prompt to send
   */
  async generateContentWithImage(imageBase64, mimeType, prompt) {
    try {
      const model = this.getModel('gemini-pro-vision');
      if (!model) {
        return { success: false, message: 'Gemini not configured', fallback: true };
      }

      const imageParts = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType || 'image/jpeg',
          },
        },
      ];

      const result = await this.executeWithRetry(() => model.generateContent([prompt, ...imageParts]));
      if (!result) {
        return { success: false, message: 'Gemini vision request failed', fallback: true };
      }

      const response = await result.response;
      const text = response.text();

      if (response.usageMetadata) {
        this.trackUsage(response.usageMetadata);
      }

      return {
        success: true,
        text,
        provider: 'gemini',
        model: 'gemini-pro-vision',
        usage: response.usageMetadata || null,
      };
    } catch (error) {
      console.error('Gemini vision error:', error.message);
      return {
        success: false,
        message: error.message,
        fallback: true,
        error,
      };
    }
  }

  /**
   * Parse JSON from Gemini response text
   */
  parseJSON(text) {
    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      return null;
    }
  }
}

// Export singleton instance for backward compatibility
const geminiClient = new GeminiClient();

module.exports = geminiClient;
module.exports.GeminiClient = GeminiClient;