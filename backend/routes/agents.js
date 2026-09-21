/**
 * AI Agent Routes (Phase 7)
 * API endpoints for AI Agent management, execution, and conversations.
 */
const express = require('express');
const router = express.Router();
const {
  seedAgents,
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  runAgent,
  getAgentTypes,
  getStats,
  listConversations,
  getConversation,
  archiveConversation,
  deleteConversation,
} = require('../controllers/agentController');
const { protect } = require('../middleware/auth');
const {
  validateCreateAgent,
  validateRunAgent,
  validateUpdateAgent,
  validateAgentId,
  validateConversationId,
  validateListAgentsQuery,
  validateListConversationsQuery,
  handleValidation,
} = require('../validators/agents');
const {
  safetyFilter,
  auditLogger,
  costTracker,
  aiRateLimiter,
} = require('../services/ai/middleware');

// Protect all agent routes
router.use(protect);

// Apply AI middleware to run endpoint
router.use('/:agentId/run', safetyFilter, auditLogger, costTracker, aiRateLimiter);
router.use('/seed', auditLogger);
router.use('/create', auditLogger);
router.use('/conversations', auditLogger);

// ─── Agent Discovery ─────────────────────────────────────────────────────
router.get('/types', getAgentTypes);
router.get('/stats', getStats);

// ─── Agent Conversation Endpoints ───────────────────────────────────────
router.get('/conversations', validateListConversationsQuery, handleValidation, listConversations);
router.get('/conversations/:conversationId', validateConversationId, handleValidation, getConversation);
router.delete('/conversations/:conversationId', validateConversationId, handleValidation, archiveConversation);
router.delete('/conversations/:conversationId/permanent', validateConversationId, handleValidation, deleteConversation);

// ─── Agent Management ────────────────────────────────────────────────────
router.post('/seed', seedAgents);
router.get('/', validateListAgentsQuery, handleValidation, listAgents);
router.post('/create', validateCreateAgent, handleValidation, createAgent);
router.get('/:agentId', validateAgentId, handleValidation, getAgent);
router.patch('/:agentId', validateAgentId, validateUpdateAgent, handleValidation, updateAgent);
router.delete('/:agentId', validateAgentId, handleValidation, deleteAgent);

// ─── Agent Execution ─────────────────────────────────────────────────────
router.post('/:agentId/run', validateAgentId, validateRunAgent, handleValidation, runAgent);

module.exports = router;