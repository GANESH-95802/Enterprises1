/**
 * Prediction Service (Phase 4 — ML & AI Analytics)
 * Makes predictions using statistical models on historical analytics data.
 * Implements linear regression, moving averages, and time-series forecasting.
 * Provides model-ready architecture for future ML model integration.
 * Follows SOLID principles — this module is solely responsible for prediction.
 */
const AnalyticsEvent = require('../../../../models/AnalyticsEvent');

class PredictionService {
  constructor() {
    this.stats = {
      totalPredictions: 0,
      totalFailures: 0,
    };
  }

  /**
   * Generate predictions based on historical analytics data.
   * @param {Object} options - { eventType, category, period, horizon, granularity }
   * @returns {Promise<Object>} - { success, data }
   */
  async predict(options = {}) {
    try {
      const eventType = options.eventType || 'user_action';
      const horizon = Math.min(options.horizon || 7, 30);
      const granularity = options.granularity || 'day';

      // Fetch historical data
      const historical = await this._getHistoricalData(eventType, options);

      if (!historical || historical.length < 5) {
        return {
          success: false,
          message: 'Insufficient historical data for prediction (need at least 5 data points)',
        };
      }

      // Build time series
      const series = historical.map((h) => h.count);
      const labels = historical.map((h) => h.period);

      // Generate predictions using linear regression + trend adjustment
      const predictions = this._linearTrendPrediction(series, horizon);

      // Compute confidence based on data quality
      const confidence = this._computeConfidence(series);

      this.stats.totalPredictions += 1;

      return {
        success: true,
        data: {
          eventType,
          granularity,
          horizon,
          predictions: predictions.map((p, i) => ({
            period: this._getFuturePeriod(labels[labels.length - 1], i + 1, granularity),
            predicted: Math.max(0, Math.round(p)),
          })),
          model: {
            type: 'linear-trend',
            confidence,
            dataPoints: series.length,
            trend: this._getTrend(series),
          },
          historical: {
            lastPeriod: labels[labels.length - 1],
            lastValue: series[series.length - 1],
            average: Math.round(series.reduce((sum, v) => sum + v, 0) / series.length * 10) / 10,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Prediction Service - error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Predict user engagement for a specific user.
   * @param {string} userId - User ID
   * @param {Object} options - { horizon, granularity }
   * @returns {Promise<Object>} - { success, data }
   */
  async predictUserEngagement(userId, options = {}) {
    try {
      const horizon = Math.min(options.horizon || 7, 30);
      const granularity = options.granularity || 'day';

      const historical = await this._getUserHistoricalData(userId, granularity);

      if (!historical || historical.length < 5) {
        return { success: false, message: 'Insufficient user data for engagement prediction' };
      }

      const series = historical.map((h) => h.count);
      const labels = historical.map((h) => h.period);

      const predictions = this._linearTrendPrediction(series, horizon);
      const confidence = this._computeConfidence(series);

      // Engagement score
      const avgActivity = series.reduce((sum, v) => sum + v, 0) / series.length;
      const engagementScore = Math.min(100, Math.round((avgActivity / 10) * 100));

      this.stats.totalPredictions += 1;

      return {
        success: true,
        data: {
          userId,
          engagementScore,
          predictions: predictions.map((p, i) => ({
            period: this._getFuturePeriod(labels[labels.length - 1], i + 1, granularity),
            predicted: Math.max(0, Math.round(p)),
          })),
          model: {
            type: 'linear-trend',
            confidence,
            dataPoints: series.length,
            trend: this._getTrend(series),
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Prediction Service - user engagement error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Predict AI resource usage (requests, cost estimates).
   * @param {Object} options - { horizon, granularity }
   * @returns {Promise<Object>} - { success, data }
   */
  async predictAIUsage(options = {}) {
    try {
      return await this.predict({ eventType: 'ai_request', ...options });
    } catch (error) {
      this.stats.totalFailures += 1;
      return { success: false, message: error.message };
    }
  }

  /**
   * Get historical event counts for prediction.
   * @param {string} eventType - Event type
   * @param {Object} options - Options
   * @returns {Promise<Array>} - Historical data points
   */
  async _getHistoricalData(eventType, options = {}) {
    const query = {};
    if (eventType) query.eventType = eventType;
    if (options.category) query.category = options.category;

    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    const days = options.days || 30;
    const startDate = options.startDate ? new Date(options.startDate) : new Date(endDate.getTime() - days * 86400000);
    query.timestamp = { $gte: startDate, $lte: endDate };

    const granularity = options.granularity || 'day';
    const dateFormat = granularity === 'hour'
      ? { $dateToString: { format: '%Y-%m-%dT%H:00:00', date: '$timestamp' } }
      : { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };

    const results = await AnalyticsEvent.aggregate([
      { $match: query },
      { $group: {
          _id: dateFormat,
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return results.map((r) => ({ period: r._id, count: r.count }));
  }

  /**
   * Get historical data for a specific user.
   * @param {string} userId - User ID
   * @param {string} granularity - 'day' or 'hour'
   * @returns {Promise<Array>} - Historical data points
   */
  async _getUserHistoricalData(userId, granularity = 'day') {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 86400000);

    const dateFormat = granularity === 'hour'
      ? { $dateToString: { format: '%Y-%m-%dT%H:00:00', date: '$timestamp' } }
      : { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };

    const results = await AnalyticsEvent.aggregate([
      { $match: { user: userId, timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: {
          _id: dateFormat,
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return results.map((r) => ({ period: r._id, count: r.count }));
  }

  /**
   * Linear trend prediction using least squares regression.
   * @param {Array<number>} series - Historical values
   * @param {number} horizon - Steps to predict
   * @returns {Array<number>} - Predicted values
   */
  _linearTrendPrediction(series, horizon) {
    const n = series.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
    const meanY = series.reduce((sum, y) => sum + y, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (indices[i] - meanX) * (series[i] - meanY);
      denominator += Math.pow(indices[i] - meanX, 2);
    }

    const slope = denominator > 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;

    const predictions = [];
    for (let h = 1; h <= horizon; h++) {
      predictions.push(intercept + slope * (n - 1 + h));
    }

    return predictions;
  }

  /**
   * Compute confidence score for predictions.
   * @param {Array<number>} series - Historical values
   * @returns {number} - Confidence 0-1
   */
  _computeConfidence(series) {
    const n = series.length;
    if (n < 5) return 0.3;

    const mean = series.reduce((sum, v) => sum + v, 0) / n;
    const variance = series.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation (lower = more consistent = higher confidence)
    const cv = mean > 0 ? stdDev / mean : 1;
    const consistencyScore = Math.max(0, 1 - cv);

    // Data sufficiency score
    const sufficiencyScore = Math.min(1, n / 30);

    // Volume score
    const volumeScore = Math.min(1, mean / 10);

    return Math.round(
      Math.min(0.95, consistencyScore * 0.5 + sufficiencyScore * 0.3 + volumeScore * 0.2) * 100
    ) / 100;
  }

  /**
   * Get forecast trend direction.
   * @param {Array<number>} series - Historical values
   * @returns {string} - 'up', 'down', or 'stable'
   */
  _getTrend(series) {
    if (series.length < 2) return 'stable';
    const firstHalf = series.slice(0, Math.floor(series.length / 2));
    const secondHalf = series.slice(Math.floor(series.length / 2));
    const firstAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / Math.max(firstAvg, 1);
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  /**
   * Get a future period label.
   * @param {string} lastPeriod - Last period label
   * @param {number} offset - Steps ahead
   * @param {string} granularity - 'day' or 'hour'
   * @returns {string} - Future period label
   */
  _getFuturePeriod(lastPeriod, offset, granularity) {
    const base = new Date(lastPeriod);
    if (isNaN(base.getTime())) return `period-${offset}`;

    const future = new Date(base);
    if (granularity === 'hour') {
      future.setHours(future.getHours() + offset);
      return future.toISOString().substring(0, 13) + ':00:00';
    }
    future.setDate(future.getDate() + offset);
    return future.toISOString().substring(0, 10);
  }

  /**
   * Get prediction service statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const predictionService = new PredictionService();

module.exports = predictionService;
module.exports.PredictionService = PredictionService;