/**
 * Recommendation Controller - HTTP handlers for the Enterprise Recommendation Engine (Phase 3B).
 */
const { recommendationEngine } = require('../services/ai/engines');

// @desc    Get recommendations for the authenticated user
// @route   GET /api/recommendations
const getRecommendations = async (req, res, next) => {
  try {
    const { type, category, limit, skip, query, sessionId, useCache } = req.query;

    const result = await recommendationEngine.getRecommendations(req.user._id, {
      type,
      category,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      query,
      sessionId,
      useCache: useCache !== undefined ? useCache === 'true' : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get personalized recommendations for the authenticated user
// @route   GET /api/recommendations/personalized
const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const { limit, skip, query, sessionId } = req.query;

    const result = await recommendationEngine.getPersonalizedRecommendations(req.user._id, {
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      query,
      sessionId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Submit feedback for a recommendation
// @route   POST /api/recommendations/feedback
const submitFeedback = async (req, res, next) => {
  try {
    const { recommendationId, type, rating, comment, source, metadata } = req.body;

    const result = await recommendationEngine.submitFeedback(req.user._id, recommendationId, type, {
      rating,
      comment,
      source,
      metadata,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendation history for the authenticated user
// @route   GET /api/recommendations/history
const getRecommendationHistory = async (req, res, next) => {
  try {
    const { type, status, limit, skip } = req.query;

    const result = await recommendationEngine.getRecommendationHistory(req.user._id, {
      type,
      status,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendation statistics for the authenticated user
// @route   GET /api/recommendations/stats
const getRecommendationStats = async (req, res, next) => {
  try {
    const result = await recommendationEngine.getRecommendationStats(req.user._id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Find similar content
// @route   POST /api/recommendations/similar
const findSimilar = async (req, res, next) => {
  try {
    const { query, type, limit } = req.body;

    const result = await recommendationEngine.findSimilar(req.user._id, {
      query,
      type,
      limit: limit ? parseInt(limit) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get available recommendation types
// @route   GET /api/recommendations/types
const getTypes = (req, res, next) => {
  try {
    res.json(recommendationEngine.getTypes());
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendation engine statistics
// @route   GET /api/recommendations/engine-stats
const getEngineStats = (req, res, next) => {
  try {
    res.json(recommendationEngine.getStats());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getPersonalizedRecommendations,
  submitFeedback,
  getRecommendationHistory,
  getRecommendationStats,
  findSimilar,
  getTypes,
  getEngineStats,
};