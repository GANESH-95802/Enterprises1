/**
 * SaaS Services (Phase 8)
 * Enterprise SaaS: organization management, subscriptions, usage tracking.
 */
const organizationService = require('./organizationService');
const subscriptionService = require('./subscriptionService');
const usageService = require('./usageService');

module.exports = {
  organizationService,
  subscriptionService,
  usageService,
};