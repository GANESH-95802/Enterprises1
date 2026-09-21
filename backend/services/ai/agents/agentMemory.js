const AgentConversation = require('../../../models/AgentConversation');

/**
 * Agent Memory
 * Provides conversation persistence and context management for AI Agents.
 * Stores multi-turn interactions with full context per agent.
 */
class AgentMemory {
  constructor() {
    this.maxHistoryMessages = 30;
    this.maxContextMessages = 10;
  }

  /**
   * Create or get an active conversation for a user-agent pair
   * @param {string} userId - User ID
   * @param {string} agentId - Agent ID
   * @param {Object} options - { sessionId, title }
   * @returns {Promise<Object>} - { success, conversation }
   */
  async getOrCreateConversation(userId, agentId, options = {}) {
    try {
      // If a sessionId is provided, try to find existing conversation
      if (options.sessionId) {
        const existing = await AgentConversation.findOne({
          user: userId,
          agentId,
          sessionId: options.sessionId,
        });

        if (existing) {
          return { success: true, conversation: existing };
        }
      }

      // Otherwise find most recent active conversation or create new
      let conversation = await AgentConversation.findOne({
        user: userId,
        agentId,
        status: 'active',
      }).sort({ updatedAt: -1 });

      if (conversation) {
        // If sessionId provided, update it
        if (options.sessionId && conversation.sessionId !== options.sessionId) {
          conversation.sessionId = options.sessionId;
          await conversation.save();
        }
        return { success: true, conversation };
      }

      // Create new conversation
      conversation = await AgentConversation.create({
        user: userId,
        agentId,
        sessionId: options.sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        title: options.title || 'New Conversation',
        messages: [],
        context: {},
        status: 'active',
      });

      return { success: true, conversation };
    } catch (error) {
      console.error('Agent memory - get/create conversation error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Save a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - { role, content, metadata, tokensUsed }
   * @returns {Promise<Object>} - { success, message }
   */
  async saveMessage(conversationId, message) {
    try {
      const conversation = await AgentConversation.findById(conversationId);
      if (!conversation) return { success: false, message: 'Conversation not found' };

      conversation.messages.push({
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        tokensUsed: message.tokensUsed || 0,
      });

      // Trim if exceeds max
      if (conversation.messages.length > this.maxHistoryMessages) {
        conversation.messages = conversation.messages.slice(-this.maxHistoryMessages);
      }

      await conversation.save();

      return {
        success: true,
        message: conversation.messages[conversation.messages.length - 1],
      };
    } catch (error) {
      console.error('Agent memory - save message error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get conversation history for context
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - { limit }
   * @returns {Promise<Array>} - Messages in chronological order
   */
  async getConversationHistory(conversationId, options = {}) {
    try {
      const conversation = await AgentConversation.findById(conversationId);
      if (!conversation) return [];

      const limit = Math.min(options.limit || this.maxContextMessages, 20);
      return conversation.messages.slice(-limit);
    } catch (error) {
      console.error('Agent memory - get history error:', error.message);
      return [];
    }
  }

  /**
   * Build context string from conversation history
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<string>} - Context string
   */
  async buildConversationContext(conversationId) {
    try {
      const messages = await this.getConversationHistory(conversationId);
      if (messages.length === 0) return '';

      return messages
        .map((m) => `${m.role === 'agent' ? 'Agent' : 'User'}: ${m.content}`)
        .join('\n');
    } catch (error) {
      console.error('Agent memory - build context error:', error.message);
      return '';
    }
  }

  /**
   * List conversations for a user and/or agent
   * @param {Object} options - { userId, agentId, status, limit, skip }
   * @returns {Promise<Object>} - { success, data: { conversations, total } }
   */
  async listConversations(options = {}) {
    try {
      const query = {};
      if (options.userId) query.user = options.userId;
      if (options.agentId) query.agentId = options.agentId;
      if (options.status) query.status = options.status;

      const limit = Math.min(options.limit || 20, 50);
      const skip = options.skip || 0;

      const [conversations, total] = await Promise.all([
        AgentConversation.find(query)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select('-messages'),
        AgentConversation.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          conversations: conversations.map((c) => ({
            id: c._id,
            agentId: c.agentId,
            agentType: c.agentType,
            title: c.title,
            status: c.status,
            sessionId: c.sessionId,
            messageCount: c.messages.length,
            updatedAt: c.updatedAt,
            createdAt: c.createdAt,
          })),
          total,
        },
      };
    } catch (error) {
      console.error('Agent memory - list conversations error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update conversation context
   * @param {string} conversationId - Conversation ID
   * @param {Object} context - Context object to merge
   * @returns {Promise<Object>} - Updated conversation
   */
  async updateContext(conversationId, context = {}) {
    try {
      const conversation = await AgentConversation.findById(conversationId);
      if (!conversation) return { success: false, message: 'Conversation not found' };

      conversation.context = { ...conversation.context, ...context };
      await conversation.save();

      return { success: true, data: { context: conversation.context } };
    } catch (error) {
      console.error('Agent memory - update context error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Archive a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Archive result
   */
  async archiveConversation(conversationId, userId) {
    try {
      const conversation = await AgentConversation.findOne({ _id: conversationId, user: userId });
      if (!conversation) return { success: false, message: 'Conversation not found', statusCode: 404 };

      conversation.status = 'archived';
      await conversation.save();

      return { success: true, message: 'Conversation archived' };
    } catch (error) {
      console.error('Agent memory - archive error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Delete result
   */
  async deleteConversation(conversationId, userId) {
    try {
      const result = await AgentConversation.deleteOne({ _id: conversationId, user: userId });
      if (result.deletedCount === 0) {
        return { success: false, message: 'Conversation not found', statusCode: 404 };
      }
      return { success: true, message: 'Conversation deleted' };
    } catch (error) {
      console.error('Agent memory - delete error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Set max history messages
   * @param {number} max - Max messages to retain per conversation
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
const agentMemory = new AgentMemory();

module.exports = agentMemory;
module.exports.AgentMemory = AgentMemory;