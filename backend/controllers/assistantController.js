/**
 * Assistant Controller - HTTP handlers for the AI Assistant Engine.
 */
const { assistantEngine } = require('../services/ai/engines');
const sessionManager = require('../services/ai/engines/assistant/sessionManager');

const chat = async (req, res, next) => {
  try {
    const { message, sessionId, profile, provider, model, temperature, maxTokens, useKnowledge, knowledgeLimit, knowledgeCategory, knowledgeMinScore } = req.body;
    if (!message || !message.trim()) { res.status(400); throw new Error('Message is required'); }
    const response = await assistantEngine.chat(req.user._id, message.trim(), {
      sessionId, profile, provider, model, temperature, maxTokens,
      useKnowledge, knowledgeLimit, knowledgeCategory, knowledgeMinScore,
    });
    res.json(response);
  } catch (error) { next(error); }
};

const chatWithTools = async (req, res, next) => {
  try {
    const { message, sessionId, profile, provider, model, temperature, maxTokens, useKnowledge, knowledgeLimit, knowledgeCategory, knowledgeMinScore } = req.body;
    if (!message || !message.trim()) { res.status(400); throw new Error('Message is required'); }
    const response = await assistantEngine.chatWithTools(req.user._id, message.trim(), {
      sessionId, profile, provider, model, temperature, maxTokens,
      useKnowledge, knowledgeLimit, knowledgeCategory, knowledgeMinScore,
    });
    res.json(response);
  } catch (error) { next(error); }
};

const streamChat = async (req, res, next) => {
  try {
    const { message, sessionId, profile, provider, model, temperature, maxTokens, useKnowledge, knowledgeLimit, knowledgeCategory, knowledgeMinScore } = req.body;
    if (!message || !message.trim()) { res.status(400); throw new Error('Message is required'); }
    await assistantEngine.streamChat(res, req.user._id, message.trim(), {
      sessionId, profile, provider, model, temperature, maxTokens,
      useKnowledge, knowledgeLimit, knowledgeCategory, knowledgeMinScore,
    });
  } catch (error) { next(error); }
};

const getProfiles = (req, res, next) => {
  try {
    res.json({ success: true, data: { profiles: assistantEngine.getProfiles(), timestamp: new Date().toISOString() } });
  } catch (error) { next(error); }
};

const getTemplates = (req, res, next) => {
  try {
    res.json({ success: true, data: { templates: assistantEngine.getTemplates(), timestamp: new Date().toISOString() } });
  } catch (error) { next(error); }
};

const getTools = (req, res, next) => {
  try {
    res.json({ success: true, data: { tools: assistantEngine.getTools(), timestamp: new Date().toISOString() } });
  } catch (error) { next(error); }
};

const getStats = (req, res, next) => {
  try {
    res.json({ success: true, data: { stats: assistantEngine.getStats(), timestamp: new Date().toISOString() } });
  } catch (error) { next(error); }
};

const listSessions = async (req, res, next) => {
  try {
    const { profile, status, limit, skip } = req.query;
    const sessions = await sessionManager.listSessions(req.user._id, {
      profile, status,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
    res.json({
      success: true,
      data: {
        sessions: sessions.map((s) => ({
          sessionId: s.sessionId, profile: s.profile, title: s.title, status: s.status,
          messageCount: s.messageCount, lastMessageAt: s.lastMessageAt, createdAt: s.createdAt,
        })),
        total: sessions.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) { next(error); }
};

const getSession = async (req, res, next) => {
  try {
    const session = await sessionManager.getSession(req.user._id, req.params.sessionId);
    if (!session) { res.status(404); throw new Error('Session not found'); }
    res.json({ success: true, data: { session, timestamp: new Date().toISOString() } });
  } catch (error) { next(error); }
};

const updateSession = async (req, res, next) => {
  try {
    const { title, settings } = req.body;
    const result = await sessionManager.updateSession(req.user._id, req.params.sessionId, { title, settings });
    if (!result.success) { res.status(404); throw new Error('Session not found'); }
    res.json({ success: true, data: { session: result.session, timestamp: new Date().toISOString() } });
  } catch (error) { next(error); }
};

const archiveSession = async (req, res, next) => {
  try {
    const result = await sessionManager.archiveSession(req.user._id, req.params.sessionId);
    if (!result.success) { res.status(404); throw new Error('Session not found'); }
    res.json({ success: true, message: 'Session archived', data: { session: result.session } });
  } catch (error) { next(error); }
};

const deleteSession = async (req, res, next) => {
  try {
    const result = await sessionManager.deleteSession(req.user._id, req.params.sessionId);
    if (!result.success) { res.status(404); throw new Error('Session not found'); }
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  chat,
  chatWithTools,
  streamChat,
  getProfiles,
  getTemplates,
  getTools,
  getStats,
  listSessions,
  getSession,
  updateSession,
  archiveSession,
  deleteSession,
};
