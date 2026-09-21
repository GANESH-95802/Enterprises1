/**
 * Insight Generator (Phase 4 — ML & AI Analytics)
 * Generates actionable insights from analytics data, trend detection, and
 * performance metrics. Uses pattern detection for anomaly and trend analysis.
 * Follows SOLID principles — this module is solely responsible for insight generation.
 */
const AnalyticsEvent = require('../../../../models/AnalyticsEvent');

class InsightGenerator {
  constructor() {
    this.stats = {
      totalInsights: 0,
      totalFailures: 0,
    };
  }

  /**
   * Generate insights for a user or the platform.
   * @param {string} userId - User ID (optional)
   * @param {Object} options - { period, startDate, endDate, limit }
   * @returns {Promise<Object>} - { success, data }
   */
  async generateInsights(userId, options = {}) {
    try {
      const [usagePatterns, anomalies, recommendations, performance] = await Promise.all([
        this._analyzeUsagePatterns(userId, options),
        this._detectAnomalies(userId, options),
        this._generateRecommendations(userId, options),
        this._analyzePerformance(userId, options),
      ]);

      const insights = [
        ...usagePatterns.insights,
        ...anomalies.insights,
        ...recommendations.insights,
        ...performance.insights,
      ].slice(0, options.limit || 25);

      this.stats.totalInsights += insights.length;

      return {
        success: true,
        data: {
          userId: userId || null,
          insights,
          summaries: {
            usage: usagePatterns.summary,
            anomalies: anomalies.summary,
            recommendations: recommendations.summary,
            performance: performance.summary,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Insight Generator - error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Analyze usage patterns for insights.
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} - { insights, summary }
   */
  async _analyzeUsagePatterns(userId, options = {}) {
    try {
      const query = {};
      if (userId) query.user = userId;
      query.timestamp = {};
      const endDate = options.endDate ? new Date(options.endDate) : new Date();
      const startDate = options.startDate ? new Date(options.startDate) : new Date(endDate.getTime() - 7 * 86400000);
      query.timestamp.$gte = startDate;
      query.timestamp.$lte = endDate;

      const [totalEvents, dailyCounts, topActions, topResources] = await Promise.all([
        AnalyticsEvent.countDocuments(query),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: '$resource', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
      ]);

      const insights = [];
      const days = dailyCounts.length || 1;
      const avgPerDay = Math.round(totalEvents / days * 10) / 10;

      if (totalEvents > 0) {
        insights.push({
          type: 'usage_volume',
          severity: avgPerDay > 50 ? 'high' : avgPerDay > 10 ? 'medium' : 'low',
          title: userId ? 'Active user engagement' : 'Platform usage volume',
          description: `${totalEvents} events recorded over ${days} day(s), averaging ${avgPerDay} per day.`,
          metric: { totalEvents, avgPerDay, days },
        });
      }

      if (topActions.length > 0) {
        insights.push({
          type: 'top_actions',
          severity: 'info',
          title: 'Most frequent actions',
          description: `Top actions: ${topActions.map((a) => `${a._id} (${a.count})`).join(', ')}`,
          metric: { topActions },
        });
      }

      if (topResources.length > 0) {
        insights.push({
          type: 'top_resources',
          severity: 'info',
          title: 'Most accessed resources',
          description: `Top resources: ${topResources.map((r) => `${r._id} (${r.count})`).join(', ')}`,
          metric: { topResources },
        });
      }

      return {
        insights,
        summary: { totalEvents, avgPerDay, activeDays: dailyCounts.length },
      };
    } catch (error) {
      return { insights: [], summary: {} };
    }
  }

  /**
   * Detect anomalies in the data.
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} - { insights, summary }
   */
  async _detectAnomalies(userId, options = {}) {
    try {
      const query = {};
      if (userId) query.user = userId;
      const endDate = options.endDate ? new Date(options.endDate) : new Date();
      const startDate = options.startDate ? new Date(options.startDate) : new Date(endDate.getTime() - 30 * 86400000);
      query.timestamp = { $gte: startDate, $lte: endDate };

      // Get daily event counts for anomaly detection
      const dailyCounts = await AnalyticsEvent.aggregate([
        { $match: query },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const insights = [];
      if (dailyCounts.length < 3) {
        return { insights: [], summary: { checkedDays: dailyCounts.length } };
      }

      const counts = dailyCounts.map((d) => d.count);
      const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
      const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / counts.length;
      const stdDev = Math.sqrt(variance);

      // Detect spikes (count > mean + 2*stdDev)
      for (const day of dailyCounts) {
        if (stdDev > 0 && day.count > mean + 2 * stdDev) {
          insights.push({
            type: 'anomaly_spike',
            severity: 'high',
            title: 'Usage spike detected',
            description: `Unusual spike of ${day.count} events on ${day._id} (mean: ${Math.round(mean * 10) / 10}, std dev: ${Math.round(stdDev * 10) / 10}).`,
            metric: { date: day._id, count: day.count, mean: Math.round(mean * 10) / 10, stdDev: Math.round(stdDev * 10) / 10 },
          });
        }
      }

      // Detect drops (count < mean - 2*stdDev)
      for (const day of dailyCounts) {
        if (stdDev > 0 && day.count < mean - 2 * stdDev) {
          insights.push({
            type: 'anomaly_drop',
            severity: 'medium',
            title: 'Usage drop detected',
            description: `Unusual drop to ${day.count} events on ${day._id} (mean: ${Math.round(mean * 10) / 10}).`,
            metric: { date: day._id, count: day.count, mean: Math.round(mean * 10) / 10 },
          });
        }
      }

      return {
        insights,
        summary: { checkedDays: dailyCounts.length, mean: Math.round(mean * 10) / 10, stdDev: Math.round(stdDev * 10) / 10 },
      };
    } catch (error) {
      return { insights: [], summary: {} };
    }
  }

  /**
   * Generate actionable recommendations.
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} - { insights, summary }
   */
  async _generateRecommendations(userId, options = {}) {
    try {
      const query = {};
      if (userId) query.user = userId;
      const endDate = options.endDate ? new Date(options.endDate) : new Date();
      const startDate = options.startDate ? new Date(options.startDate) : new Date(endDate.getTime() - 7 * 86400000);
      query.timestamp = { $gte: startDate, $lte: endDate };

      const [errorRate] = await Promise.all([
        AnalyticsEvent.aggregate([
          { $match: { ...query, eventType: { $in: ['ai_request', 'user_action'] } } },
          { $group: {
              _id: null,
              total: { $sum: 1 },
              errors: { $sum: { $cond: ['$success', 0, 1] } },
            },
          },
        ]),
      ]);

      const insights = [];
      const total = errorRate[0]?.total || 0;
      const errors = errorRate[0]?.errors || 0;

      if (total > 0 && errors / total > 0.1) {
        insights.push({
          type: 'error_rate_alert',
          severity: 'high',
          title: 'High error rate detected',
          description: `Error rate is ${Math.round((errors / total) * 10000) / 100}% (${errors} errors out of ${total} requests). Consider investigating system health.`,
          metric: { total, errors, errorRate: Math.round((errors / total) * 10000) / 100 },
        });
      }

      // Check recommendation performance
      const recQuery = { ...query, eventType: { $in: ['recommendation_view', 'recommendation_click'] } };
      const recStats = await AnalyticsEvent.aggregate([
        { $match: recQuery },
        { $group: {
            _id: null,
            views: { $sum: { $cond: [{ $eq: ['$eventType', 'recommendation_view'] }, 1, 0] } },
            clicks: { $sum: { $cond: [{ $eq: ['$eventType', 'recommendation_click'] }, 1, 0] } },
          },
        },
      ]);

      if (recStats[0]?.views > 10) {
        const ctr = recStats[0].clicks / recStats[0].views;
        if (ctr < 0.1) {
          insights.push({
            type: 'recommendation_quality',
            severity: 'medium',
            title: 'Recommendation engagement is low',
            description: `Click-through rate is ${Math.round(ctr * 10000) / 100}%. Consider refining recommendation personalization.`,
            metric: { views: recStats[0].views, clicks: recStats[0].clicks, ctr: Math.round(ctr * 10000) / 100 },
          });
        }
      }

      return { insights, summary: { total, errors } };
    } catch (error) {
      return { insights: [], summary: {} };
    }
  }

  /**
   * Analyze AI performance for insights.
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} - { insights, summary }
   */
  async _analyzePerformance(userId, options = {}) {
    try {
      const query = { eventType: 'ai_response' };
      if (userId) query.user = userId;
      const endDate = options.endDate ? new Date(options.endDate) : new Date();
      const startDate = options.startDate ? new Date(options.startDate) : new Date(endDate.getTime() - 7 * 86400000);
      query.timestamp = { $gte: startDate, $lte: endDate };

      const stats = await AnalyticsEvent.aggregate([
        { $match: query },
        { $group: {
            _id: null,
            total: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            maxDuration: { $max: '$duration' },
            errors: { $sum: { $cond: ['$success', 0, 1] } },
          },
        },
      ]);

      const insights = [];
      if (stats[0]?.total > 0) {
        const avg = stats[0].avgDuration || 0;
        if (avg > 5000) {
          insights.push({
            type: 'ai_latency_alert',
            severity: 'medium',
            title: 'AI response latency is high',
            description: `Average response time is ${Math.round(avg)}ms. Consider optimizing prompts or upgrading model.`,
            metric: { avgLatency: Math.round(avg), total: stats[0].total },
          });
        }
      }

      return {
        insights,
        summary: {
          totalResponses: stats[0]?.total || 0,
          avgLatencyMs: Math.round((stats[0]?.avgDuration || 0) * 10) / 10,
          errors: stats[0]?.errors || 0,
        },
      };
    } catch (error) {
      return { insights: [], summary: {} };
    }
  }

  /**
   * Get insight generator statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const insightGenerator = new InsightGenerator();

module.exports = insightGenerator;
module.exports.InsightGenerator = InsightGenerator;