/**
 * AI Agent Controller - HTTP handlers for Phase 7 AI Agent endpoints.
 */
const agentManager = require('../services/ai/agents');
const Activity = require('../models/Activity');

// @desc    Seed system agents for current user
// @route   POST /api/agents/seed
const seedAgents = async (req, res, next) => {
  try {
    const result = await agentManager.seedSystemAgents(req.user._id);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    List available AI agents
// @route   GET /api/agents
const listAgents = async (req, res, next) => {
  try {
    const { type, status, limit } = req.query;
    const result = await agentManager.listAgents({
      userId: req.user._id,
      type,
      status,
      limit: limit ? parseInt(limit) : undefined,
    });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get a single AI agent
// @route   GET /api/agents/:agentId
const getAgent = async (req, res, next) => {
  try {
    const result = await agentManager.getAgent(req.params.agentId, req.user._id);
    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Create a new AI agent
// @route   POST /api/agents/create
const createAgent = async (req, res, next) => {
  try {
    const { name, type, description, configuration, permissions } = req.body;
    const result = await agentManager.createAgent({
      name,
      type,
      description,
      configuration,
      permissions,
      createdBy: req.user._id,
    });
    if (!result.success) return res.status(400).json(result);

    await Activity.create({
      user: req.user._id,
      action: 'create',
      resource: 'ai-agent',
      resourceId: result.data.agent._id,
      details: `Created AI agent: ${name}`,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
    }).catch(() => {});

    res.status(201).json(result);
  } catch (error) { next(error); }
};

// @desc    Update an AI agent
// @route   PATCH /api/agents/:agentId
const updateAgent = async (req, res, next) => {
  try {
    const result = await agentManager.updateAgent(req.params.agentId, req.user._id, req.body);
    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Delete an AI agent
// @route   DELETE /api/agents/:agentId
const deleteAgent = async (req, res, next) => {
  try {
    const result = await agentManager.deleteAgent(req.params.agentId, req.user._id);
    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }

    await Activity.create({
      user: req.user._id,
      action: 'delete',
      resource: 'ai-agent',
      resourceId: req.params.agentId,
      details: `Deleted AI agent`,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
    }).catch(() => {});

    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Run an AI agent
// @route   POST /api/agents/:agentId/run
const runAgent = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    const result = await agentManager.runAgent(req.user._id, req.params.agentId, message, {
      sessionId,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }

    await Activity.create({
      user: req.user._id,
      action: 'view',
      resource: 'ai-agent-run',
      resourceId: req.params.agentId,
      details: `Ran AI agent: ${result.data?.agentName || req.params.agentId}`,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
    }).catch(() => {});

    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get available agent types
// @route   GET /api/agents/types
const getAgentTypes = (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        types: agentManager.getAgentTypes(),
        implementations: agentManager.getAvailableImplementations(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) { next(error); }
};

// @desc    Get agent framework stats
// @route   GET /api/agents/stats
const getStats = (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        stats: agentManager.getStats(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) { next(error); }
};

// @desc    List agent conversations
// @route   GET /api/agents/conversations
const listConversations = async (req, res, next) => {
  try {
    const { agentId, status, limit, skip } = req.query;
    const result = await agentManager.listConversations({
      userId: req.user._id,
      agentId,
      status,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get a conversation
// @route   GET /api/agents/conversations/:conversationId
const getConversation = async (req, res, next) => {
  try {
    const result = await agentManager.getConversation(req.params.conversationId, req.user._id);
    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Archive a conversation
// @route   DELETE /api/agents/conversations/:conversationId
const archiveConversation = async (req, res, next) => {
  try {
    const result = await agentManager.archiveConversation(req.params.conversationId, req.user._id);
    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Delete a conversation
// @route   DELETE /api/agents/conversations/:conversationId/permanent
const deleteConversation = async (req, res, next) => {
  try {
    const result = await agentManager.deleteConversation(req.params.conversationId, req.user._id);
    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = {
  seedAgents,
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  runAgent,
  getAgentTypes,
  getStats,
  listConversations,
  getConversation,
  archiveConversation,
  deleteConversation,
};