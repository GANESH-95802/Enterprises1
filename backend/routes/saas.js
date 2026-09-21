/**
 * SaaS Routes (Phase 8)
 * API endpoints for organization management, subscriptions, billing, and usage.
 */
const express = require('express');
const router = express.Router();
const {
  registerOrganization,
  getMyOrganizations,
  getOrganization,
  updateOrganization,
  getTeam,
  inviteMember,
  updateMember,
  removeMember,
  getSubscription,
  changePlan,
  cancelSubscription,
  listInvoices,
  getUsage,
  getUsageHistory,
  getPlans,
  getPlatformUsage,
} = require('../controllers/saasController');
const { protect } = require('../middleware/auth');
const { auditLogger } = require('../services/ai/middleware');

// Protect all SaaS routes
router.use(protect);

// Apply audit logging
router.use('/organizations', auditLogger);
router.use('/admin', auditLogger);

// ─── Plans & Pricing ─────────────────────────────────────────────────────
router.get('/plans', getPlans);

// ─── Organization Management ─────────────────────────────────────────────
router.post('/organizations/register', registerOrganization);
router.get('/organizations', getMyOrganizations);
router.get('/organizations/:orgId', getOrganization);
router.patch('/organizations/:orgId', updateOrganization);

// ─── Team Management ─────────────────────────────────────────────────────
router.get('/organizations/:orgId/team', getTeam);
router.post('/organizations/:orgId/team/invite', inviteMember);
router.patch('/organizations/:orgId/team/:memberId', updateMember);
router.delete('/organizations/:orgId/team/:memberId', removeMember);

// ─── Subscription & Billing ──────────────────────────────────────────────
router.get('/organizations/:orgId/subscription', getSubscription);
router.post('/organizations/:orgId/subscription/change', changePlan);
router.post('/organizations/:orgId/subscription/cancel', cancelSubscription);
router.get('/organizations/:orgId/invoices', listInvoices);

// ─── Usage Tracking ──────────────────────────────────────────────────────
router.get('/organizations/:orgId/usage', getUsage);
router.get('/organizations/:orgId/usage/history', getUsageHistory);

// ─── Admin ───────────────────────────────────────────────────────────────
router.get('/admin/platform-usage', getPlatformUsage);

module.exports = router;