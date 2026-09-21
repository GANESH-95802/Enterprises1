/**
 * Monitoring Routes (Phase 5 — Production Readiness)
 * API endpoints for health checks, performance metrics, security audits, and error tracking.
 */
const express = require('express');
const router = express.Router();
const {
  getHealth,
  getPerformance,
  runSecurityAudit,
  getSecurityAudit,
  getErrorStats,
} = require('../controllers/monitoringController');

// Public health check endpoint (no auth required)
router.get('/health', getHealth);

// Protect the rest
const { protect } = require('../middleware/auth');
const { auditLogger } = require('../services/ai/middleware');
router.use(protect);
router.use(auditLogger);

// Performance metrics
router.get('/performance', getPerformance);

// Security audit
router.get('/security-audit', getSecurityAudit);
router.post('/security-audit', runSecurityAudit);

// Error tracking
router.get('/errors', getErrorStats);

module.exports = router;