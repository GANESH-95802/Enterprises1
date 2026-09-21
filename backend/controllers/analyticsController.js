/**
 * Analytics Controller - HTTP handlers for Phase 4 ML & AI Analytics.
 */
const { analyticsEngine } = require('../services/ai/engines');

// @desc    Track an analytics event
// @route   POST /api/analytics/events
const trackEvent = async (req, res, next) => {
  try {
    const { eventType, category, action, resource, resourceId, sessionId, metadata, duration, success, error } = req.body;

    const result = await analyticsEngine.trackEvent({
      userId: req.user._id,
      eventType,
      category,
      action,
      resource,
      resourceId,
      sessionId,
      metadata,
      duration,
      success,
      error,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Track multiple events in a batch
// @route   POST /api/analytics/events/batch
const trackEvents = async (req, res, next) => {
  try {
    const { events } = req.body;

    const enriched = events.map((event) => ({
      ...event,
      userId: event.userId || req.user._id,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    }));

    const result = await analyticsEngine.trackEvents(enriched);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user behavior analytics
// @route   GET /api/analytics/users/:userId/behavior
const getUserBehavior = async (req, res, next) => {
  try {
    const { eventType, category, startDate, endDate, limit } = req.query;

    const result = await analyticsEngine.getUserBehavior(req.params.userId, {
      eventType,
      category,
      startDate,
      endDate,
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

// @desc    Get AI usage analytics
// @route   GET /api/analytics/ai/usage
const getAIUsage = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await analyticsEngine.getAIUsage({ startDate, endDate });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI performance metrics
// @route   GET /api/analytics/ai/performance
const getAIPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await analyticsEngine.getAIPerformance({ startDate, endDate });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommendation analytics
// @route   GET /api/analytics/recommendations
const getRecommendationAnalytics = async (req, res, next) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const result = await analyticsEngine.getRecommendationAnalytics(userId, { startDate, endDate });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get conversation insights
// @route   GET /api/analytics/conversations
const getConversationInsights = async (req, res, next) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const result = await analyticsEngine.getConversationInsights(userId, { startDate, endDate });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get trend detection data
// @route   GET /api/analytics/trends
const getTrends = async (req, res, next) => {
  try {
    const { eventType, category, granularity, startDate, endDate } = req.query;

    const result = await analyticsEngine.getTrends({ eventType, category, granularity, startDate, endDate });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate insights
// @route   GET /api/analytics/insights
const generateInsights = async (req, res, next) => {
  try {
    const { userId, limit, startDate, endDate } = req.query;

    const result = await analyticsEngine.generateInsights(userId, {
      limit: limit ? parseInt(limit) : undefined,
      startDate,
      endDate,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate predictions
// @route   GET /api/analytics/predictions
const predict = async (req, res, next) => {
  try {
    const { eventType, category, horizon, granularity, days } = req.query;

    const result = await analyticsEngine.predict({
      eventType,
      category,
      horizon: horizon ? parseInt(horizon) : undefined,
      granularity,
      days: days ? parseInt(days) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Predict user engagement
// @route   GET /api/analytics/users/:userId/predict
const predictUserEngagement = async (req, res, next) => {
  try {
    const { horizon } = req.query;

    const result = await analyticsEngine.predictUserEngagement(req.params.userId, {
      horizon: horizon ? parseInt(horizon) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Extract ML features
// @route   GET /api/analytics/ml/features
const extractFeatures = async (req, res, next) => {
  try {
    const { userId, days } = req.query;

    const result = await analyticsEngine.extractFeatures({
      userId,
      days: days ? parseInt(days) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Build feature vectors
// @route   GET /api/analytics/ml/feature-vectors
const buildFeatureVectors = async (req, res, next) => {
  try {
    const { userId, days } = req.query;

    const result = await analyticsEngine.buildFeatureVectors({
      userId,
      days: days ? parseInt(days) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Run metric aggregation
// @route   POST /api/analytics/aggregate
const runAggregation = async (req, res, next) => {
  try {
    const result = await analyticsEngine.runAggregation();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics engine statistics
// @route   GET /api/analytics/stats
const getStats = (req, res, next) => {
  try {
    res.json(analyticsEngine.getStats());
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics capabilities
// @route   GET /api/analytics/capabilities
const getCapabilities = (req, res, next) => {
  try {
    res.json(analyticsEngine.getCapabilities());
  } catch (error) {
    next(error);
  }
};

module.exports = {
  trackEvent,
  trackEvents,
  getUserBehavior,
  getAIUsage,
  getAIPerformance,
  getRecommendationAnalytics,
  getConversationInsights,
  getTrends,
  generateInsights,
  predict,
  predictUserEngagement,
  extractFeatures,
  buildFeatureVectors,
  runAggregation,
  getStats,
  getCapabilities,
};