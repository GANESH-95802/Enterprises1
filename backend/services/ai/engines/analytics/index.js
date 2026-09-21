/**
 * Analytics Engine (Phase 4 — ML & AI Analytics)
 * Enterprise AI analytics and intelligence layer.
 * Integrates with the AI Enterprise Hub for user behavior analytics, AI usage analytics,
 * recommendation analytics, conversation insights, trend detection, prediction models,
 * and AI performance metrics.
 *
 * Modules:
 * - Metrics Collector: Event tracking and metric aggregation
 * - Insight Generator: Actionable insights and anomaly detection
 * - Prediction Service: Time-series forecasting
 * - ML Service Layer: Feature extraction and model-ready architecture
 */
const metricsCollector = require('./metricsCollector');
const insightGenerator = require('./insightGenerator');
const predictionService = require('./predictionService');
const mlServiceLayer = require('./mlServiceLayer');

class AnalyticsEngine {
  constructor() {
    this.initialized = false;
    this.stats = {
      totalEvents: 0,
      totalInsights: 0,
      totalPredictions: 0,
      totalFeatures: 0,
      totalFailures: 0,
    };
  }

  /**
   * Initialize the analytics engine
   */
  initialize() {
    this.initialized = true;
    console.log('Analytics Engine initialized');
    return true;
  }

  /**
   * Track an analytics event.
   * @param {Object} event - Event data
   * @returns {Promise<Object>} - { success, data }
   */
  async trackEvent(event) {
    this.stats.totalEvents += 1;
    try {
      const result = await metricsCollector.trackEvent(event);
      if (!result.success) this.stats.totalFailures += 1;
      return result;
    } catch (error) {
      this.stats.totalFailures += 1;
      return { success: false, message: error.message };
    }
  }

  /**
   * Track multiple events in a batch.
   * @param {Array<Object>} events - Events array
   * @returns {Promise<Object>} - { success, count }
   */
  async trackEvents(events) {
    try {
      return await metricsCollector.trackEvents(events);
    } catch (error) {
      this.stats.totalFailures += 1;
      return { success: false, message: error.message };
    }
  }

  /**
   * Get user behavior analytics.
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { success, data }
   */
  async getUserBehavior(userId, options = {}) {
    try {
      return await metricsCollector.getUserBehavior(userId, options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get AI usage analytics.
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { success, data }
   */
  async getAIUsage(options = {}) {
    try {
      return await metricsCollector.getAIUsage(options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get AI performance metrics.
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { success, data }
   */
  async getAIPerformance(options = {}) {
    try {
      return await metricsCollector.getAIPerformance(options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get recommendation analytics.
   * @param {string} userId - User ID (optional)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { success, data }
   */
  async getRecommendationAnalytics(userId, options = {}) {
    try {
      return await metricsCollector.getRecommendationAnalytics(userId, options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get conversation insights.
   * @param {string} userId - User ID (optional)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { success, data }
   */
  async getConversationInsights(userId, options = {}) {
    try {
      return await metricsCollector.getConversationInsights(userId, options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get trend detection data.
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { success, data }
   */
  async getTrends(options = {}) {
    try {
      return await metricsCollector.getTrendData(options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate insights.
   * @param {string} userId - User ID (optional)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - { success, data }
   */
  async generateInsights(userId, options = {}) {
    this.stats.totalInsights += 1;
    try {
      return await insightGenerator.generateInsights(userId, options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate predictions.
   * @param {Object} options - Prediction options
   * @returns {Promise<Object>} - { success, data }
   */
  async predict(options = {}) {
    this.stats.totalPredictions += 1;
    try {
      return await predictionService.predict(options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Predict user engagement.
   * @param {string} userId - User ID
   * @param {Object} options - Prediction options
   * @returns {Promise<Object>} - { success, data }
   */
  async predictUserEngagement(userId, options = {}) {
    this.stats.totalPredictions += 1;
    try {
      return await predictionService.predictUserEngagement(userId, options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Extract ML features.
   * @param {Object} options - Feature extraction options
   * @returns {Promise<Object>} - { success, data }
   */
  async extractFeatures(options = {}) {
    this.stats.totalFeatures += 1;
    try {
      return await mlServiceLayer.extractFeatures(options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Build feature vectors.
   * @param {Object} options - Feature vector options
   * @returns {Promise<Object>} - { success, data }
   */
  async buildFeatureVectors(options = {}) {
    this.stats.totalFeatures += 1;
    try {
      return await mlServiceLayer.buildFeatureVectors(options);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Run metric aggregation.
   * @returns {Promise<Object>} - Aggregation result
   */
  async runAggregation() {
    try {
      return await metricsCollector.runAggregation();
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Get analytics engine statistics.
   * @returns {Object} - { success, data }
   */
  getStats() {
    return {
      success: true,
      data: {
        engine: { ...this.stats },
        collector: metricsCollector.getStats(),
        insights: insightGenerator.getStats(),
        predictions: predictionService.getStats(),
        ml: mlServiceLayer.getStats(),
      },
    };
  }

  /**
   * Get analytics capabilities.
   * @returns {Object} - { success, data }
   */
  getCapabilities() {
    return {
      success: true,
      data: {
        id: 'analytics',
        name: 'Analytics Engine',
        description: 'Enterprise AI analytics with user behavior, AI usage, insights, predictions, and ML services.',
        features: [
          { id: 'behavior', name: 'User Behavior Analytics', description: 'Track and analyze user actions and engagement' },
          { id: 'ai-usage', name: 'AI Usage Analytics', description: 'Monitor AI requests, latency, and error rates' },
          { id: 'recommendations', name: 'Recommendation Analytics', description: 'Track recommendation engagement and feedback' },
          { id: 'conversations', name: 'Conversation Insights', description: 'Analyze conversation patterns and metrics' },
          { id: 'trends', name: 'Trend Detection', description: 'Detect usage trends and anomalies' },
          { id: 'predictions', name: 'Prediction Models', description: 'Forecast usage and engagement with linear regression' },
          { id: 'ml', name: 'ML Service Layer', description: 'Feature extraction and model-ready architecture' },
        ],
      },
    };
  }
}

// Export singleton
const analyticsEngine = new AnalyticsEngine();

module.exports = analyticsEngine;
module.exports.AnalyticsEngine = AnalyticsEngine;