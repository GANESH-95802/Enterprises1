/**
 * SaaS Controller - HTTP handlers for Phase 8 Enterprise SaaS endpoints.
 */
const { organizationService, subscriptionService, usageService } = require('../services/saas');
const TeamMember = require('../models/TeamMember');
const Activity = require('../models/Activity');

// Helper: get user's organization and role
const getOrgContext = async (userId) => {
  const member = await TeamMember.findOne({ userId, status: 'active' }).sort({ createdAt: 1 });
  if (!member) return null;
  return { organizationId: member.organizationId, role: member.role };
};

// @desc    Register a new company
// @route   POST /api/saas/organizations/register
const registerOrganization = async (req, res, next) => {
  try {
    const { companyName, industry, description, size } = req.body;
    const result = await organizationService.registerOrganization({
      companyName,
      industry,
      description,
      size,
      ownerId: req.user._id,
    });
    if (!result.success) return res.status(400).json(result);

    await Activity.create({
      user: req.user._id,
      action: 'create',
      resource: 'organization',
      resourceId: result.data.organization.id,
      details: `Registered company: ${companyName}`,
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
    }).catch(() => {});

    res.status(201).json(result);
  } catch (error) { next(error); }
};

// @desc    Get current user's organizations
// @route   GET /api/saas/organizations
const getMyOrganizations = async (req, res, next) => {
  try {
    const result = await organizationService.getOrganizationsForUser(req.user._id);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get organization details
// @route   GET /api/saas/organizations/:orgId
const getOrganization = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this organization' });
    }
    const result = await organizationService.getOrganization(req.params.orgId);
    if (!result.success) return res.status(result.statusCode || 404).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Update organization profile
// @route   PATCH /api/saas/organizations/:orgId
const updateOrganization = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const result = await organizationService.updateOrganization(req.params.orgId, req.body, { role: ctx.role });
    if (!result.success) return res.status(result.statusCode || 400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get team members
// @route   GET /api/saas/organizations/:orgId/team
const getTeam = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const result = await organizationService.listTeamMembers(req.params.orgId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Invite team member
// @route   POST /api/saas/organizations/:orgId/team/invite
const inviteMember = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['owner', 'admin'].includes(ctx.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to invite members' });
    }
    const result = await organizationService.inviteMember({
      organizationId: req.params.orgId,
      email: req.body.email,
      role: req.body.role,
      invitedBy: req.user._id,
    });
    if (!result.success) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

// @desc    Update team member
// @route   PATCH /api/saas/organizations/:orgId/team/:memberId
const updateMember = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const result = await organizationService.updateMember(req.params.orgId, req.params.memberId, req.body, { role: ctx.role });
    if (!result.success) return res.status(result.statusCode || 400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Remove team member
// @route   DELETE /api/saas/organizations/:orgId/team/:memberId
const removeMember = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const result = await organizationService.removeMember(req.params.orgId, req.params.memberId, { role: ctx.role });
    if (!result.success) return res.status(result.statusCode || 400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get subscription
// @route   GET /api/saas/organizations/:orgId/subscription
const getSubscription = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const result = await subscriptionService.getSubscription(req.params.orgId);
    if (!result.success) return res.status(result.statusCode || 404).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Change subscription plan
// @route   POST /api/saas/organizations/:orgId/subscription/change
const changePlan = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['owner', 'admin'].includes(ctx.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to change subscription' });
    }
    const result = await subscriptionService.changePlan(req.params.orgId, req.body.plan, {
      billingCycle: req.body.billingCycle,
    });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Cancel subscription
// @route   POST /api/saas/organizations/:orgId/subscription/cancel
const cancelSubscription = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['owner', 'admin'].includes(ctx.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel subscription' });
    }
    const result = await subscriptionService.cancelSubscription(req.params.orgId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    List invoices
// @route   GET /api/saas/organizations/:orgId/invoices
const listInvoices = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { status, limit, skip } = req.query;
    const result = await subscriptionService.listInvoices(req.params.orgId, {
      status,
      limit: limit ? parseInt(limit) : undefined,
      skip: skip ? parseInt(skip) : undefined,
    });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get current usage
// @route   GET /api/saas/organizations/:orgId/usage
const getUsage = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const result = await usageService.getCurrentUsage(req.params.orgId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get usage history
// @route   GET /api/saas/organizations/:orgId/usage/history
const getUsageHistory = async (req, res, next) => {
  try {
    const ctx = await getOrgContext(req.user._id);
    if (!ctx || String(ctx.organizationId) !== req.params.orgId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { months } = req.query;
    const result = await usageService.getUsageHistory(req.params.orgId, {
      months: months ? parseInt(months) : undefined,
    });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

// @desc    Get platform plans
// @route   GET /api/saas/plans
const getPlans = (req, res, next) => {
  try {
    res.json({
      success: true,
      data: { plans: subscriptionService.getPlans() },
    });
  } catch (error) { next(error); }
};

// @desc    Get platform usage (admin)
// @route   GET /api/saas/admin/platform-usage
const getPlatformUsage = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const result = await usageService.getPlatformUsage({ period: req.query.period });
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = {
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
};