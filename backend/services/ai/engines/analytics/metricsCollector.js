/**
 * Metrics Collector (Phase 4 — ML & AI Analytics)
 * Collects, stores, and aggregates analytics events and AI performance metrics.
 * Uses the AnalyticsEvent and AiMetric models for persistent storage.
 * Follows SOLID principles — this module is solely responsible for metric collection.
 */
const AnalyticsEvent = require('../../../../models/AnalyticsEvent');
const AiMetric = require('../../../../models/AiMetric');

class MetricsCollector {
  constructor() {
    this.stats = {
      totalEvents: 0,
      totalMetrics: 0,
      totalFailures: 0,
    };
    this.bufferSize = 100;
    this.eventBuffer = [];
    this.flushInterval = 60 * 1000; // 1 minute
    this._startFlushInterval();
  }

  /**
   * Track an analytics event.
   * @param {Object} event - { userId, eventType, category, action, resource, resourceId, sessionId, metadata, duration, success, error, ip, userAgent }
   * @returns {Promise<Object>} - { success, data }
   */
  async trackEvent(event) {
    this.stats.totalEvents += 1;

    try {
      const eventDoc = await AnalyticsEvent.create({
        user: event.userId || null,
        eventType: event.eventType,
        category: event.category,
        action: event.action || '',
        resource: event.resource || '',
        resourceId: event.resourceId || null,
        sessionId: event.sessionId || '',
        metadata: event.metadata || {},
        duration: event.duration || 0,
        success: event.success !== undefined ? event.success : true,
        error: event.error || '',
        ip: event.ip || '',
        userAgent: event.userAgent || '',
      });

      return { success: true, data: { eventId: eventDoc._id } };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Metrics Collector - track error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Track multiple events in a batch.
   * @param {Array<Object>} events - Array of event objects
   * @returns {Promise<Object>} - { success, count }
   */
  async trackEvents(events) {
    try {
      if (!Array.isArray(events) || events.length === 0) {
        return { success: false, message: 'Events array is required' };
      }

      let successCount = 0;
      const errors = [];

      for (const event of events.slice(0, 500)) {
        const result = await this.trackEvent(event);
        if (result.success) {
          successCount += 1;
        } else {
          errors.push(result.message);
        }
      }

      return {
        success: successCount > 0,
        count: successCount,
        total: events.length,
        errors: errors.slice(0, 10),
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Metrics Collector - batch error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Aggregate analytics events into AiMetric records.
   * @param {string} metricType - Metric type
   * @param {string} period - Aggregation period (hourly, daily, weekly, monthly)
   * @param {Date} startTime - Period start
   * @param {Date} endTime - Period end
   * @param {Object} dimensions - Additional dimensions (e.g. { userId })
   * @returns {Promise<Object>} - Aggregation result
   */
  async aggregateMetric(metricType, period, startTime, endTime, dimensions = {}) {
    try {
      const query = {
        timestamp: { $gte: startTime, $lte: endTime },
        success: true,
      };

      if (dimensions.userId) query.user = dimensions.userId;

      const [totalEvents, events, failures] = await Promise.all([
        AnalyticsEvent.countDocuments(query),
        AnalyticsEvent.find(query).select('eventType category action duration metadata').lean(),
        AnalyticsEvent.countDocuments({ ...query, success: false }),
      ]);

      if (totalEvents === 0) {
        return { success: true, data: { totalEvents: 0, period, aggregated: false } };
      }

      // Compute aggregates
      const byEventType = {};
      const byCategory = {};
      const byAction = {};
      let totalDuration = 0;
      let maxDuration = 0;
      let minDuration = Number.MAX_SAFE_INTEGER;

      for (const event of events) {
        byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1;
        byCategory[event.category] = (byCategory[event.category] || 0) + 1;
        if (event.action) {
          byAction[event.action] = (byAction[event.action] || 0) + 1;
        }
        if (event.duration) {
          totalDuration += event.duration;
          maxDuration = Math.max(maxDuration, event.duration);
          minDuration = Math.min(minDuration, event.duration);
        }
      }

      const avgDuration = events.length > 0 ? totalDuration / events.length : 0;

      const metric = await AiMetric.findOneAndUpdate(
        {
          metricType,
          period,
          startTime,
          endTime,
          'dimensions.userId': dimensions.userId || null,
        },
        {
          metricType,
          period,
          startTime,
          endTime,
          dimensions,
          metrics: {
            totalEvents,
            failures,
            byEventType,
            byCategory,
            byAction,
          },
          counts: {
            totalEvents,
            failures,
          },
          averages: {
            duration: Math.round(avgDuration * 100) / 100,
            maxDuration,
            minDuration: minDuration === Number.MAX_SAFE_INTEGER ? 0 : minDuration,
          },
          totals: {
            duration: totalDuration,
          },
        },
        { upsert: true, new: true }
      );

      this.stats.totalMetrics += 1;

      return {
        success: true,
        data: {
          metricId: metric._id,
          metricType,
          period,
          totalEvents,
          aggregated: true,
        },
      };
    } catch (error) {
      this.stats.totalFailures += 1;
      console.error('Metrics Collector - aggregate error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get user behavior analytics.
   * @param {string} userId - User ID
   * @param {Object} options - { period, startDate, endDate, limit }
   * @returns {Promise<Object>} - { success, data }
   */
  async getUserBehavior(userId, options = {}) {
    try {
      const query = { user: userId };
      if (options.eventType) query.eventType = options.eventType;
      if (options.category) query.category = options.category;
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      const limit = Math.min(options.limit || 20, 100);

      const [events, totals] = await Promise.all([
        AnalyticsEvent.find(query)
          .sort({ timestamp: -1 })
          .limit(limit)
          .select('eventType category action resource sessionId duration success metadata timestamp')
          .lean(),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: {
              _id: null,
              total: { $sum: 1 },
              totalDuration: { $sum: '$duration' },
              successCount: { $sum: { $cond: ['$success', 1, 0] } },
              errorCount: { $sum: { $cond: ['$success', 0, 1] } },
            },
          },
        ]),
      ]);

      const byType = await AnalyticsEvent.aggregate([
        { $match: query },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return {
        success: true,
        data: {
          userId,
          events: events.map((e) => ({
            id: e._id,
            eventType: e.eventType,
            category: e.category,
            action: e.action,
            resource: e.resource,
            sessionId: e.sessionId,
            duration: e.duration,
            success: e.success,
            timestamp: e.timestamp,
          })),
          totals: {
            total: totals[0]?.total || 0,
            totalDuration: totals[0]?.totalDuration || 0,
            successCount: totals[0]?.successCount || 0,
            errorCount: totals[0]?.errorCount || 0,
          },
          byType: byType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Metrics Collector - user behavior error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get AI usage analytics.
   * @param {Object} options - { period, startDate, endDate, limit }
   * @returns {Promise<Object>} - { success, data }
   */
  async getAIUsage(options = {}) {
    try {
      const query = {
        eventType: { $in: ['ai_request', 'ai_response'] },
      };
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      const [total, byType, byAction, failureRate] = await Promise.all([
        AnalyticsEvent.countDocuments({ eventType: 'ai_request' }),
        AnalyticsEvent.aggregate([
          { $match: { eventType: { $in: ['ai_request', 'ai_response'] }, ...(query.timestamp ? { timestamp: query.timestamp } : {}) } },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: { eventType: 'ai_request' } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ]),
        AnalyticsEvent.aggregate([
          { $match: { eventType: 'ai_request' } },
          { $group: {
              _id: null,
              total: { $sum: 1 },
              failures: { $sum: { $cond: ['$success', 0, 1] } },
            },
          },
        ]),
      ]);

      const usageData = byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const totalRequests = failureRate[0]?.total || 0;
      const totalFailures = failureRate[0]?.failures || 0;

      return {
        success: true,
        data: {
          totalRequests,
          requests: usageData.ai_request || 0,
          responses: usageData.ai_response || 0,
          failureRate: totalRequests > 0 ? Math.round((totalFailures / totalRequests) * 10000) / 100 : 0,
          totalFailures,
          byAction: byAction.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Metrics Collector - AI usage error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get AI performance metrics.
   * @param {Object} options - { period, startDate, endDate }
   * @returns {Promise<Object>} - { success, data }
   */
  async getAIPerformance(options = {}) {
    try {
      const query = { eventType: 'ai_response' };
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      const [eventStats, metricSnapshots] = await Promise.all([
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: {
              _id: null,
              total: { $sum: 1 },
              avgDuration: { $avg: '$duration' },
              maxDuration: { $max: '$duration' },
              minDuration: { $min: '$duration' },
              successCount: { $sum: { $cond: ['$success', 1, 0] } },
              errorCount: { $sum: { $cond: ['$success', 0, 1] } },
            },
          },
        ]),
        AiMetric.find({ metricType: 'ai_latency' })
          .sort({ startTime: -1 })
          .limit(30)
          .select('startTime endTime averages totals metadata')
          .lean(),
      ]);

      const stats = eventStats[0] || {};

      return {
        success: true,
        data: {
          totalResponses: stats.total || 0,
          averageLatencyMs: Math.round((stats.avgDuration || 0) * 100) / 100,
          maxLatencyMs: stats.maxDuration || 0,
          minLatencyMs: stats.minDuration || 0,
          successRate: stats.total > 0
            ? Math.round(((stats.successCount || 0) / stats.total) * 10000) / 100
            : 100,
          errorCount: stats.errorCount || 0,
          timeline: metricSnapshots.map((m) => ({
            startTime: m.startTime,
            avgLatency: m.averages?.duration || 0,
            totalEvents: m.metrics?.totalEvents || 0,
          })),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Metrics Collector - AI performance error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get recommendation analytics.
   * @param {string} userId - User ID (optional)
   * @param {Object} options - { period, startDate, endDate }
   * @returns {Promise<Object>} - { success, data }
   */
  async getRecommendationAnalytics(userId, options = {}) {
    try {
      const query = {
        eventType: { $in: ['recommendation_view', 'recommendation_click', 'recommendation_feedback'] },
      };
      if (userId) query.user = userId;
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      const [byType, feedbackStats] = await Promise.all([
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: { eventType: 'recommendation_feedback' } },
          { $group: {
              _id: '$metadata.feedbackType',
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const typeStats = byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      const totalViewed = typeStats.recommendation_view || 0;
      const totalClicked = typeStats.recommendation_click || 0;

      return {
        success: true,
        data: {
          totalViews: totalViewed,
          totalClicks: totalClicked,
          clickThroughRate: totalViewed > 0
            ? Math.round((totalClicked / totalViewed) * 10000) / 100
            : 0,
          feedbackDistribution: feedbackStats.reduce((acc, item) => {
            acc[item._id || 'unknown'] = item.count;
            return acc;
          }, {}),
          byType: typeStats,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Metrics Collector - recommendation analytics error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get conversation insights.
   * @param {string} userId - User ID (optional)
   * @param {Object} options - { period, startDate, endDate }
   * @returns {Promise<Object>} - { success, data }
   */
  async getConversationInsights(userId, options = {}) {
    try {
      const query = {
        eventType: { $in: ['conversation_start', 'conversation_message', 'conversation_end'] },
      };
      if (userId) query.user = userId;
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      const [byType, sessionStats, activeSessions] = await Promise.all([
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: '$eventType', count: { $sum: 1 } } },
        ]),
        AnalyticsEvent.aggregate([
          { $match: { eventType: 'conversation_end' } },
          { $group: {
              _id: null,
              total: { $sum: 1 },
              avgMessages: { $avg: '$metadata.messageCount' },
              avgDuration: { $avg: '$duration' },
              maxMessages: { $max: '$metadata.messageCount' },
            },
          },
        ]),
        AnalyticsEvent.countDocuments({ eventType: 'conversation_start' }),
      ]);

      const typeStats = byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});

      return {
        success: true,
        data: {
          totalConversations: typeStats.conversation_start || 0,
          totalMessages: typeStats.conversation_message || 0,
          completedConversations: typeStats.conversation_end || 0,
          activeConversations: activeSessions,
          averages: {
            messagesPerConversation: sessionStats[0]?.avgMessages || 0,
            durationMinutes: sessionStats[0]?.avgDuration
              ? Math.round(sessionStats[0].avgDuration / 60000 * 10) / 10
              : 0,
            maxMessages: sessionStats[0]?.maxMessages || 0,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Metrics Collector - conversation insights error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get trend detection data.
   * @param {Object} options - { eventType, category, startDate, endDate, granularity }
   * @returns {Promise<Object>} - { success, data }
   */
  async getTrendData(options = {}) {
    try {
      const query = {};
      if (options.eventType) query.eventType = options.eventType;
      if (options.category) query.category = options.category;
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
        if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
      }

      const granularity = options.granularity || 'day';
      const dateFormat = granularity === 'hour'
        ? { $dateToString: { format: '%Y-%m-%dT%H:00:00', date: '$timestamp' } }
        : { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };

      const [trends, totals] = await Promise.all([
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: {
              _id: dateFormat,
              count: { $sum: 1 },
              successCount: { $sum: { $cond: ['$success', 1, 0] } },
              errorCount: { $sum: { $cond: ['$success', 0, 1] } },
            },
          },
          { $sort: { _id: 1 } },
          { $limit: 90 },
        ]),
        AnalyticsEvent.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: 1 } } },
        ]),
      ]);

      return {
        success: true,
        data: {
          granularity,
          total: totals[0]?.total || 0,
          trends: trends.map((t) => ({
            period: t._id,
            count: t.count,
            successCount: t.successCount,
            errorCount: t.errorCount,
            successRate: t.count > 0 ? Math.round((t.successCount / t.count) * 10000) / 100 : 100,
          })),
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Metrics Collector - trends error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Run periodic metric aggregation.
   * @returns {Promise<Object>} - Aggregation results
   */
  async runAggregation() {
    try {
      const now = new Date();
      const results = [];

      // Daily aggregation for the past 24 hours
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const metricTypes = ['ai_usage', 'ai_latency', 'ai_errors', 'user_behavior', 'recommendation_performance', 'conversation_stats'];

      for (const metricType of metricTypes) {
        const result = await this.aggregateMetric(metricType, 'daily', dayStart, dayEnd);
        results.push({ metricType, ...result });
      }

      return { success: true, data: { results, aggregated: true, timestamp: now.toISOString() } };
    } catch (error) {
      console.error('Metrics Collector - aggregation error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Flush buffered events (placeholder for batch processing)
   */
  async flushBuffer() {
    // Event buffer is not used for now since events are tracked directly.
    return { success: true, flushed: 0 };
  }

  /**
   * Start periodic flush interval
   */
  _startFlushInterval() {
    this._flushTimer = setInterval(() => {
      this.flushBuffer().catch(() => {});
    }, this.flushInterval);
    this._flushTimer.unref?.();
  }

  /**
   * Get metrics collector statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;
module.exports.MetricsCollector = MetricsCollector;