/**
 * Monitoring Controller - HTTP handlers for Phase 5 Production Readiness.
 */
const healthService = require('../services/monitoring/healthService');
const securityAuditService = require('../services/monitoring/securityAuditService');
const mongoose = require('mongoose');

// @desc    Get system health status
// @route   GET /api/monitoring/health
const getHealth = async (req, res, next) => {
  try {
    const result = await healthService.getHealth();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get system performance metrics
// @route   GET /api/monitoring/performance
const getPerformance = async (req, res, next) => {
  try {
    const used = process.memoryUsage();
    const dbState = mongoose.connection.readyState;

    res.json({
      success: true,
      data: {
        process: {
          uptime: Math.floor(process.uptime()),
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        memory: {
          heapUsedMB: Math.round(used.heapUsed / 1024 / 1024 * 10) / 10,
          heapTotalMB: Math.round(used.heapTotal / 1024 / 1024 * 10) / 10,
          rssMB: Math.round(used.rss / 1024 / 1024 * 10) / 10,
          externalMB: Math.round((used.external || 0) / 1024 / 1024 * 10) / 10,
        },
        database: {
          state: dbState === 1 ? 'connected' : 'disconnected',
          readyState: dbState,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run security audit
// @route   POST /api/monitoring/security-audit
const runSecurityAudit = async (req, res, next) => {
  try {
    const result = await securityAuditService.runAudit();
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// @desc    Get security audit results
// @route   GET /api/monitoring/security-audit
const getSecurityAudit = (req, res, next) => {
  try {
    res.json(securityAuditService.getLastAudit());
  } catch (error) {
    next(error);
  }
};

// @desc    Get error tracking statistics
// @route   GET /api/monitoring/errors
const getErrorStats = async (req, res, next) => {
  try {
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    const [totalErrors, byType, recentErrors] = await Promise.all([
      AnalyticsEvent.countDocuments({ eventType: 'error', timestamp: { $gte: startDate, $lte: endDate } }),
      AnalyticsEvent.aggregate([
        { $match: { eventType: 'error', timestamp: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AnalyticsEvent.find({ eventType: 'error', timestamp: { $gte: startDate, $lte: endDate } })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('action resource error timestamp success')
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        totalErrors,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentErrors: recentErrors.map((e) => ({
          id: e._id,
          action: e.action,
          resource: e.resource,
          error: e.error,
          timestamp: e.timestamp,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getPerformance,
  runSecurityAudit,
  getSecurityAudit,
  getErrorStats,
};