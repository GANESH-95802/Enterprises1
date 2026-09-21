/**
 * ML Service Layer (Phase 4 — ML & AI Analytics)
 * Provides model-ready architecture for machine learning integration.
 * Includes feature extraction, model metadata, and training pipeline readiness.
 * Future ML models can be plugged in through this layer.
 * Follows SOLID principles — this module is solely responsible for ML service abstraction.
 */
const AnalyticsEvent = require('../../../../models/AnalyticsEvent');

class MLServiceLayer {
  constructor() {
    this.stats = {
      totalFeatureExtractions: 0,
      totalModelCalls: 0,
      totalFailures: 0,
    };
    this.models = {}; // Registry for loaded models
  }

  /**
   * Extract features from analytics data for model training/inference.
   * @param {Object} options - { userId, eventType, category, days }
   * @returns {Promise<Object>} - { success, data }
   */
  async extractFeatures(options = {}) {
    try {
      const days = options.days || 30;
      const endDate = options.endDate ? new Date(options.endDate) : new Date();
      const startDate = options.startDate ? new Date(options.startDate) : new Date(endDate.getTime() - days * 86400000);

      const query = {
        timestamp: { $gte: startDate, $lte: endDate },
      };
      if (options.userId) query.user = options.userId;
      if (options.eventType) query.eventType = options.eventType;
      if (options.category) query.category = options.category;

      // Compute basic features
      const [total, byType, byCategory, hourlyActivity, dailyActivity] = await Promise.all([
        AnalyticsEvent.countDocuments(query),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
        ]),
      ]);

      const features = {
        total_events: total,
        unique_days: dailyActivity.length,
        events_per_day: total / Math.max(dailyActivity.length, 1),
        hour_distribution: hourlyActivity.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        event_type_distribution: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        category_distribution: byCategory.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };

      this.stats.totalFeatureExtractions += 1;

      return {
        success: true,
        data: {
          features,
          featureCount: Object.keys(features).length,
          period: { startDate, endDate },
          provider: 'statistical',
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('ML Service Layer - feature extraction error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Build feature vectors for model-ready architecture.
   * @param {Object} options - { userId, eventType, days }
   * @returns {Promise<Object>} - { success, data }
   */
  async buildFeatureVectors(options = {}) {
    try {
      const result = await this.extractFeatures(options);
      if (!result.success) return result;

      const features = result.data.features;
      const vector = [];

      // Flatten features into a numeric vector
      vector.push(features.total_events || 0);
      vector.push(features.unique_days || 0);
      vector.push(features.events_per_day || 0);

      // Add hour distribution (24 features)
      for (let h = 0; h < 24; h++) {
        vector.push(features.hour_distribution?.[h] || 0);
      }

      // Add event type distribution (normalized)
      const eventTypes = ['user_action', 'ai_request', 'ai_response', 'recommendation_view', 'recommendation_click', 'conversation_message', 'document_upload', 'search_query'];
      const total = Math.max(features.total_events, 1);
      for (const type of eventTypes) {
        vector.push(((features.event_type_distribution?.[type] || 0) / total));
      }

      return {
        success: true,
        data: {
          vector,
          dimensions: vector.length,
          shape: [1, vector.length],
          labels: ['total_events', 'unique_days', 'events_per_day', ...Array.from({ length: 24 }, (_, i) => `hour_${i}`), ...eventTypes],
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      return { success: false, message: error.message };
    }
  }

  /**
   * Register a model in the model registry.
   * @param {string} modelId - Model identifier
   * @param {Object} modelConfig - { name, type, version, provider }
   * @returns {Object} - Registration result
   */
  registerModel(modelId, modelConfig = {}) {
    try {
      this.models[modelId] = {
        id: modelId,
        name: modelConfig.name || modelId,
        type: modelConfig.type || 'unknown',
        version: modelConfig.version || '1.0.0',
        provider: modelConfig.provider || 'built-in',
        registeredAt: new Date().toISOString(),
      };
      return { success: true, data: this.models[modelId] };
    } catch (error) {
      this.stats.totalFailures += 1;
      return { success: false, message: error.message };
    }
  }

  /**
   * Get registered models.
   * @returns {Object} - { success, data }
   */
  getRegisteredModels() {
    return {
      success: true,
      data: {
        models: Object.values(this.models),
        total: Object.keys(this.models).length,
      },
    };
  }

  /**
   * Get ML capabilities.
   * @returns {Object} - { success, data }
   */
  getMLCapabilities() {
    return {
      success: true,
      data: {
        featureExtraction: true,
        featureVectors: true,
        statisticalModels: ['linear-trend', 'moving-average'],
        mlModels: Object.values(this.models),
        futureIntegration: 'TensorFlow.js, ONNX, or external model APIs can be registered via registerModel()',
      },
    };
  }

  /**
   * Get ML service layer statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const mlServiceLayer = new MLServiceLayer();

module.exports = mlServiceLayer;
module.exports.MLServiceLayer = MLServiceLayer;