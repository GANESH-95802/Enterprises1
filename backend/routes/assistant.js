/**
 * Assistant Routes
 * API endpoints for the AI Assistant Engine (Phase 2).
 */
const express = require('express');
const router = express.Router();
const {
  chat,
  chatWithTools,
  streamChat,
  getProfiles,
  getTemplates,
  getTools,
  getStats,
  listSessions,
  getSession,
  updateSession,
  archiveSession,
  deleteSession,
} = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');
const { validateChatMessage, validateSessionUpdate, handleValidation } = require('../validators/assistant');
const {
  safetyFilter,
  auditLogger,
  costTracker,
  aiRateLimiter,
} = require('../services/ai/middleware');

// Protect all assistant routes
router.use(protect);

// Apply AI middleware
router.use('/chat', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/profiles', auditLogger);
router.use('/templates', auditLogger);
router.use('/tools', auditLogger);
router.use('/sessions', auditLogger);

// ─── Assistant Chat Endpoints (Phase 2) ────────────────────────────────
router.post('/chat', validateChatMessage, handleValidation, chat);
router.post('/chat/tools', validateChatMessage, handleValidation, chatWithTools);
router.post('/chat/stream', validateChatMessage, handleValidation, streamChat);

// ─── Discovery Endpoints ───────────────────────────────────────────────
router.get('/profiles', getProfiles);
router.get('/templates', getTemplates);
router.get('/tools', getTools);
router.get('/stats', getStats);

// ─── Session Management Endpoints ──────────────────────────────────────
router.get('/sessions', listSessions);
router.get('/sessions/:sessionId', getSession);
router.patch('/sessions/:sessionId', validateSessionUpdate, handleValidation, updateSession);
router.delete('/sessions/:sessionId', archiveSession);
router.delete('/sessions/:sessionId/permanent', deleteSession);

module.exports = router;