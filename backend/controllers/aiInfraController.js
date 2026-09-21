const orchestrator = require('../services/ai/orchestrator');
const responseBuilder = require('../services/ai/orchestrator/responseBuilder');

// @desc    Process an AI query
// @route   POST /api/ai/query
const processQuery = async (req, res, next) => {
  try {
    const { query, sessionId, provider, parseJSON, temperature, maxTokens, useCache, type } = req.body;

    if (!query || !query.trim()) {
      res.status(400);
      throw new Error('Query is required');
    }

    const response = await orchestrator.processQuery(req.user._id, query.trim(), {
      sessionId,
      provider,
      parseJSON,
      temperature,
      maxTokens,
      useCache,
      type,
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI conversation history
// @route   GET /api/ai/history
const getHistory = async (req, res, next) => {
  try {
    const { sessionId, limit } = req.query;
    const response = await orchestrator.getHistory(req.user._id, {
      sessionId,
      limit: limit ? parseInt(limit) : undefined,
    });
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI context
// @route   GET /api/ai/context
const getContext = async (req, res, next) => {
  try {
    const response = await orchestrator.getContext(req.user._id);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback on an AI response
// @route   POST /api/ai/feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { messageId, rating, feedback } = req.body;

    if (!messageId) {
      res.status(400);
      throw new Error('Message ID is required');
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400);
      throw new Error('Rating must be between 1 and 5');
    }

    const response = await orchestrator.submitFeedback(req.user._id, {
      messageId,
      rating: parseInt(rating),
      feedback,
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear AI conversation history
// @route   DELETE /api/ai/history
const clearHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const result = await orchestrator.clearConversation(req.user._id, sessionId);
    res.json({
      success: true,
      message: 'Conversation history cleared',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processQuery,
  getHistory,
  getContext,
  submitFeedback,
  clearHistory,
};