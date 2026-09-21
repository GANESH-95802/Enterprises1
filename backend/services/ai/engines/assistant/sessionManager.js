/**
 * Session Manager - Manages conversation session lifecycle for the assistant engine.
 */
const AiConversationSession = require('../../../../models/AiConversationSession');
const crypto = require('crypto');

const generateSessionId = () => crypto.randomBytes(16).toString('hex');

class SessionManager {
  async createSession(userId, options = {}) {
    try {
      const session = await AiConversationSession.create({
        user: userId,
        sessionId: generateSessionId(),
        profile: options.profile || 'general',
        title: options.title || 'New Conversation',
        settings: {
          provider: options.settings?.provider || 'auto',
          model: options.settings?.model || '',
          temperature: options.settings?.temperature !== undefined ? options.settings.temperature : 0.7,
          maxTokens: options.settings?.maxTokens || 1500,
          stream: options.settings?.stream || false,
        },
      });
      return { success: true, session };
    } catch (error) {
      console.error('Session Manager - create session error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getSession(userId, sessionId) {
    try {
      return await AiConversationSession.findOne({ user: userId, sessionId, status: 'active' });
    } catch (error) {
      console.error('Session Manager - get session error:', error.message);
      return null;
    }
  }

  async getOrCreateSession(userId, options = {}) {
    if (options.sessionId) {
      const existing = await this.getSession(userId, options.sessionId);
      if (existing) return { success: true, session: existing };
    }
    return this.createSession(userId, options);
  }

  async updateSession(userId, sessionId, updates = {}) {
    try {
      const allowed = ['title', 'profile', 'status'];
      const patch = {};
      for (const key of allowed) {
        if (updates[key] !== undefined) patch[key] = updates[key];
      }
      if (updates.settings) patch.settings = updates.settings;
      const session = await AiConversationSession.findOneAndUpdate(
        { user: userId, sessionId },
        patch,
        { new: true }
      );
      return { success: !!session, session };
    } catch (error) {
      console.error('Session Manager - update session error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async touchSession(userId, sessionId) {
    try {
      await AiConversationSession.findOneAndUpdate(
        { user: userId, sessionId },
        { $inc: { messageCount: 1 }, lastMessageAt: new Date() }
      );
    } catch (error) {
      console.error('Session Manager - touch session error:', error.message);
    }
  }

  async archiveSession(userId, sessionId) {
    return this.updateSession(userId, sessionId, { status: 'archived' });
  }

  async listSessions(userId, options = {}) {
    try {
      const query = { user: userId };
      if (options.profile) query.profile = options.profile;
      if (options.status) query.status = options.status;
      const limit = Math.min(options.limit || 20, 100);
      const skip = options.skip || 0;
      return await AiConversationSession.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error('Session Manager - list sessions error:', error.message);
      return [];
    }
  }

  async deleteSession(userId, sessionId) {
    try {
      const result = await AiConversationSession.deleteOne({ user: userId, sessionId });
      const AiConversation = require('../../../../models/AiConversation');
      await AiConversation.deleteMany({ user: userId, sessionId });
      return { success: result.deletedCount > 0 };
    } catch (error) {
      console.error('Session Manager - delete session error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

const sessionManager = new SessionManager();
module.exports = sessionManager;
module.exports.SessionManager = SessionManager;