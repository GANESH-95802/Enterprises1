/**
 * Response Builder
 * Formats AI provider responses into standardized API responses.
 * Handles JSON parsing, error normalization, and consistent response structure.
 */
class ResponseBuilder {
  constructor() {
    this.defaultMaxResponseLength = 10000;
  }

  /**
   * Build a successful response
   * @param {Object} data - Response data from AI provider
   * @returns {Object} - Standardized response
   */
  buildSuccess(data) {
    return {
      success: true,
      data: {
        message: data.message || '',
        provider: data.provider || 'unknown',
        model: data.model || 'unknown',
        timestamp: new Date().toISOString(),
        usage: data.usage || null,
        metadata: data.metadata || {},
      },
    };
  }

  /**
   * Build an error response
   * @param {string} message - Error message
   * @param {Object} options - { provider, statusCode, details }
   * @returns {Object} - Standardized error response
   */
  buildError(message, options = {}) {
    return {
      success: false,
      error: {
        message: message || 'AI request failed',
        provider: options.provider || 'unknown',
        statusCode: options.statusCode || 500,
        details: options.details || null,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Build a streaming response chunk
   * @param {string} content - Content chunk
   * @param {Object} options - { done, provider }
   * @returns {Object} - Streaming chunk
   */
  buildStreamChunk(content, options = {}) {
    return {
      success: !options.done,
      type: options.done ? 'done' : 'chunk',
      data: {
        content,
        provider: options.provider || 'unknown',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Build a cached response
   * @param {Object} data - Cached data
   * @param {Object} options - { cacheKey, expiresAt }
   * @returns {Object} - Cached response
   */
  buildCached(data, options = {}) {
    return {
      success: true,
      cached: true,
      data: {
        ...data,
        cacheKey: options.cacheKey,
        expiresAt: options.expiresAt,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Parse JSON from AI provider response text
   * @param {string} text - Raw response text
   * @returns {Object|null} - Parsed JSON or null
   */
  parseJSON(text) {
    if (!text) return null;
    try {
      // Try direct parse first
      return JSON.parse(text);
    } catch {
      // Try stripping markdown code fences
      try {
        const cleaned = text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        return JSON.parse(cleaned);
      } catch {
        // Try extracting first JSON object/array
        try {
          const match = text.match(/(\{.*\}|\[.*\])/s);
          if (match) {
            return JSON.parse(match[0]);
          }
        } catch {
          // Give up
        }
        return null;
      }
    }
  }

  /**
   * Normalize text length
   * @param {string} text - Text to normalize
   * @param {number} maxLength - Max length
   * @returns {string} - Normalized text
   */
  truncateText(text, maxLength = null) {
    const limit = maxLength || this.defaultMaxResponseLength;
    if (!text) return '';
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '... (truncated)';
  }

  /**
   * Build a response that includes provider fallback information
   * @param {Object} result - Result from query router
   * @param {Object} options - { cacheHit, cacheKey, contextSize }
   * @returns {Object} - Final response
   */
  buildFromRouterResult(result, options = {}) {
    if (!result || !result.success) {
      return this.buildError(
        result?.message || 'AI processing failed',
        {
          provider: result?.provider,
          details: result?.error || null,
        }
      );
    }

    // Parse JSON if the response was requested as structured
    let parsedData = null;
    if (options.parseJSON) {
      parsedData = this.parseJSON(result.text || result.message);
    }

    const response = {
      success: true,
      data: {
        message: result.text || result.message || '',
        provider: result.provider || 'unknown',
        model: result.model || 'unknown',
        timestamp: new Date().toISOString(),
        usage: result.usage || null,
        routed: result.routed || false,
      },
    };

    // Add parsed data if available
    if (parsedData) {
      response.data.parsed = parsedData;
    }

    // Add cache info
    if (options.cacheHit) {
      response.cached = true;
      response.data.cacheKey = options.cacheKey;
    }

    // Add context info
    if (options.contextSize !== undefined) {
      response.data.contextSize = options.contextSize;
    }

    // Truncate long responses
    response.data.message = this.truncateText(response.data.message);

    return response;
  }

  /**
   * Build feedback response
   * @param {Object} result - Feedback save result
   * @returns {Object} - Feedback response
   */
  buildFeedback(result) {
    if (result && result.success) {
      return {
        success: true,
        message: 'Feedback recorded successfully',
        data: {
          feedbackId: result.message ? String(result.message._id) : null,
          timestamp: new Date().toISOString(),
        },
      };
    }
    return this.buildError(result?.message || 'Failed to record feedback');
  }

  /**
   * Build conversation history response
   * @param {Array} messages - Conversation messages
   * @param {Object} options - { sessionId, total }
   * @returns {Object} - History response
   */
  buildHistory(messages, options = {}) {
    return {
      success: true,
      data: {
        messages: messages.map((m) => ({
          id: m._id ? String(m._id) : null,
          role: m.role,
          content: m.content,
          sessionId: m.sessionId || options.sessionId,
          timestamp: m.createdAt || new Date().toISOString(),
          metadata: m.metadata || {},
        })),
        sessionId: options.sessionId || 'default',
        total: options.total || messages.length,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Build context response
   * @param {Object} context - Context object
   * @returns {Object} - Context response
   */
  buildContext(context) {
    return {
      success: true,
      data: {
        context,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Export singleton
const responseBuilder = new ResponseBuilder();

module.exports = responseBuilder;
module.exports.ResponseBuilder = ResponseBuilder;