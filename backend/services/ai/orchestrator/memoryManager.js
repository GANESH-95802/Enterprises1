const AiConversation = require('../../../models/AiConversation');

/**
 * Memory Manager
 * Manages conversation history persistence and retrieval.
 * Stores and retrieves AI conversation context per user.
 */
class MemoryManager {
  constructor() {
    this.maxHistoryMessages = 20; // Default max messages to load
    this.maxContextMessages = 10; // Max messages to include in context window
  }

  /**
   * Save a conversation message
   * @param {Object} data - { userId, role, content, sessionId, metadata }
   * @returns {Promise<Object>} - Saved conversation record
   */
  async saveMessage({ userId, role, content, sessionId, metadata = {} }) {
    try {
      const message = await AiConversation.create({
        user: userId,
        role,
        content,
        sessionId: sessionId || 'default',
        metadata,
      });

      // Trim old messages if conversation exceeds the limit
      await this.trimConversation(userId, sessionId || 'default');

      return message;
    } catch (error) {
      console.error('Memory Manager - save message error:', error.message);
      return null;
    }
  }

  /**
   * Get conversation history for a user
   * @param {string} userId - User ID
   * @param {Object} options - { sessionId, limit, before }
   * @returns {Promise<Array>} - Array of messages
   */
  async getConversationHistory(userId, options = {}) {
    try {
      const query = { user: userId };
      if (options.sessionId) {
        query.sessionId = options.sessionId;
      }
      if (options.before) {
        query.createdAt = { $lt: options.before };
      }

      const limit = Math.min(options.limit || this.maxHistoryMessages, 100);

      const messages = await AiConversation.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Memory Manager - get history error:', error.message);
      return [];
    }
  }

  /**
   * Get the last N messages for context window
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} - Messages in chronological order
   */
  async getContextWindow(userId, sessionId = 'default') {
    try {
      const messages = await AiConversation.find({
        user: userId,
        sessionId,
      })
        .sort({ createdAt: -1 })
        .limit(this.maxContextMessages);

      return messages.reverse().map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      }));
    } catch (error) {
      console.error('Memory Manager - context window error:', error.message);
      return [];
    }
  }

  /**
   * Clear conversation history for a user
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID (optional, clears all if omitted)
   */
  async clearConversation(userId, sessionId = null) {
    try {
      const query = { user: userId };
      if (sessionId) {
        query.sessionId = sessionId;
      }
      const result = await AiConversation.deleteMany(query);
      return { success: true, deleted: result.deletedCount };
    } catch (error) {
      console.error('Memory Manager - clear conversation error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete a specific message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID (for authorization)
   */
  async deleteMessage(messageId, userId) {
    try {
      const result = await AiConversation.deleteOne({ _id: messageId, user: userId });
      return { success: result.deletedCount > 0 };
    } catch (error) {
      console.error('Memory Manager - delete message error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Rate a response (feedback)
   * @param {string} messageId - Message ID
   * @param {number} rating - Rating (1-5)
   * @param {string} feedback - Optional feedback text
   */
  async rateResponse(messageId, userId, rating, feedback = '') {
    try {
      const result = await AiConversation.findOneAndUpdate(
        { _id: messageId, user: userId },
        {
          'metadata.rating': rating,
          'metadata.feedback': feedback,
          'metadata.ratedAt': new Date().toISOString(),
        },
        { new: true }
      );
      return { success: !!result, message: result };
    } catch (error) {
      console.error('Memory Manager - rate response error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Trim old messages to keep conversation within limits
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   */
  async trimConversation(userId, sessionId = 'default') {
    try {
      const count = await AiConversation.countDocuments({ user: userId, sessionId });
      const maxMessages = process.env.AI_MAX_HISTORY_MESSAGES
        ? parseInt(process.env.AI_MAX_HISTORY_MESSAGES)
        : this.maxHistoryMessages;

      if (count > maxMessages) {
        const excess = count - maxMessages;
        const oldMessages = await AiConversation.find({ user: userId, sessionId })
          .sort({ createdAt: 1 })
          .limit(excess);
        const oldMessageIds = oldMessages.map((m) => m._id);
        await AiConversation.deleteMany({ _id: { $in: oldMessageIds } });
      }

      return true;
    } catch (error) {
      console.error('Memory Manager - trim conversation error:', error.message);
      return false;
    }
  }

  /**
   * Search conversation history
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - { limit }
   */
  async searchHistory(userId, query, options = {}) {
    try {
      const limit = Math.min(options.limit || 20, 100);
      const messages = await AiConversation.find({
        user: userId,
        content: { $regex: query, $options: 'i' },
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages;
    } catch (error) {
      console.error('Memory Manager - search history error:', error.message);
      return [];
    }
  }

  /**
   * Get conversation statistics for a user
   * @param {string} userId - User ID
   */
  async getUserStats(userId) {
    try {
      const [totalMessages, conversations, lastActivity] = await Promise.all([
        AiConversation.countDocuments({ user: userId }),
        AiConversation.distinct('sessionId', { user: userId }),
        AiConversation.findOne({ user: userId }).sort({ createdAt: -1 }),
      ]);

      return {
        totalMessages,
        totalConversations: conversations.length,
        sessions: conversations,
        lastActivity: lastActivity?.createdAt || null,
      };
    } catch (error) {
      console.error('Memory Manager - user stats error:', error.message);
      return { totalMessages: 0, totalConversations: 0 };
    }
  }

  /**
   * Set max history messages
   * @param {number} max - Max messages to retain
   */
  setMaxHistoryMessages(max) {
    this.maxHistoryMessages = max;
  }

  /**
   * Set max context messages
   * @param {number} max - Max messages for context window
   */
  setMaxContextMessages(max) {
    this.maxContextMessages = max;
  }
}

// Export singleton
const memoryManager = new MemoryManager();

module.exports = memoryManager;
module.exports.MemoryManager = MemoryManager;