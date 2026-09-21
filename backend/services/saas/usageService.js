const UsageTracking = require('../../models/UsageTracking');
const Subscription = require('../../models/Subscription');
const Organization = require('../../models/Organization');
const TeamMember = require('../../models/TeamMember');

/**
 * Usage Tracking Service
 * Tracks AI usage, tokens, API calls, and storage per organization.
 * Enforces usage limits and generates warning notifications.
 */
class UsageService {
  constructor() {
    this.costPerToken = {
      gemini: 0.00001,
      openai: 0.00003,
      fallback: 0.000001,
    };
  }

  /**
   * Get or create usage record for current billing period
   * @param {string} organizationId - Organization ID
   * @param {Date} date - Date to determine period
   * @returns {Promise<Object>} - Usage record
   */
  async getOrCreateUsage(organizationId, date = new Date()) {
    const period = this._formatPeriod(date);
    let usage = await UsageTracking.findOne({ organizationId, period });

    if (!usage) {
      usage = await UsageTracking.create({
        organizationId,
        period,
        aiRequests: 0,
        apiCalls: 0,
        tokensUsed: 0,
        tokensByProvider: { gemini: 0, openai: 0, fallback: 0 },
        storageBytes: 0,
        documentsUploaded: 0,
        agentsRun: 0,
        agentsByType: {},
        costEstimate: 0,
        activeUsers: 0,
        userActivity: {},
        featureUsage: {},
        warnings: [],
      });
    }

    return usage;
  }

  /**
   * Track an AI request usage
   * @param {string} organizationId - Organization ID
   * @param {Object} data - { tokensUsed, provider, agentType, feature }
   * @returns {Promise<Object>} - Updated usage
   */
  async trackUsage(organizationId, data = {}) {
    try {
      const usage = await this.getOrCreateUsage(organizationId);
      const provider = data.provider || 'unknown';
      const tokens = data.tokensUsed || 0;

      usage.aiRequests += 1;
      usage.apiCalls += 1;
      usage.tokensUsed += tokens;
      usage.tokensByProvider[provider] = (usage.tokensByProvider[provider] || 0) + tokens;

      if (data.agentType) {
        usage.agentsRun += 1;
        usage.agentsByType[data.agentType] = (usage.agentsByType[data.agentType] || 0) + 1;
      }

      if (data.feature) {
        usage.featureUsage[data.feature] = (usage.featureUsage[data.feature] || 0) + 1;
      }

      // Cost estimation
      usage.costEstimate += tokens * (this.costPerToken[provider] || this.costPerToken.openai);

      // Check limits
      await this._checkLimits(usage, data.tokensUsed || 0);

      await usage.save();
      return { success: true, data: { usage: this._serializeUsage(usage) } };
    } catch (error) {
      console.error('Usage service - track error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Track document upload
   * @param {string} organizationId - Organization ID
   * @param {Object} data - { fileSize, count }
   * @returns {Promise<Object>} - Updated usage
   */
  async trackStorage(organizationId, data = {}) {
    try {
      const usage = await this.getOrCreateUsage(organizationId);
      usage.storageBytes += data.fileSize || 0;
      usage.documentsUploaded += data.count || 1;
      await usage.save();
      return { success: true, data: { usage: this._serializeUsage(usage) } };
    } catch (error) {
      console.error('Usage service - track storage error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Track user activity
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Updated usage
   */
  async trackUserActivity(organizationId, userId) {
    try {
      const usage = await this.getOrCreateUsage(organizationId);
      const userKey = String(userId);
      usage.userActivity[userKey] = (usage.userActivity[userKey] || 0) + 1;
      usage.activeUsers = Object.keys(usage.userActivity).length;
      await usage.save();
      return { success: true };
    } catch (error) {
      console.error('Usage service - track user error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current usage for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Usage and limits
   */
  async getCurrentUsage(organizationId) {
    try {
      const usage = await this.getOrCreateUsage(organizationId);
      const subscription = await Subscription.findOne({ organizationId });
      const limits = subscription?.usageLimits || {
        aiRequestsPerMonth: 100,
        tokensPerMonth: 100000,
        storageMb: 1024,
        maxAgents: 3,
        maxUsers: 5,
        maxDocuments: 50,
      };

      const usagePercentages = {
        aiRequests: limits.aiRequestsPerMonth > 0
          ? Math.min(100, Math.round((usage.aiRequests / limits.aiRequestsPerMonth) * 100))
          : 0,
        tokens: limits.tokensPerMonth > 0
          ? Math.min(100, Math.round((usage.tokensUsed / limits.tokensPerMonth) * 100))
          : 0,
        storage: limits.storageMb > 0
          ? Math.min(100, Math.round((usage.storageBytes / (limits.storageMb * 1024 * 1024)) * 100))
          : 0,
      };

      return {
        success: true,
        data: {
          usage: this._serializeUsage(usage),
          limits,
          usagePercentages,
          isOverLimit: usagePercentages.aiRequests >= 100 || usagePercentages.tokens >= 100,
          warnings: usage.warnings.slice(-5),
        },
      };
    } catch (error) {
      console.error('Usage service - get current error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get usage history for analytics
   * @param {string} organizationId - Organization ID
   * @param {Object} options - { months }
   * @returns {Promise<Object>} - Usage history
   */
  async getUsageHistory(organizationId, options = {}) {
    try {
      const months = options.months || 6;
      const periods = [];
      const now = new Date();

      for (let i = 0; i < months; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periods.push(this._formatPeriod(date));
      }

      const usage = await UsageTracking.find({
        organizationId,
        period: { $in: periods },
      }).sort({ period: 1 });

      const usageMap = {};
      for (const u of usage) {
        usageMap[u.period] = this._serializeUsage(u);
      }

      const history = periods.reverse().map((period) => ({
        period,
        ...(usageMap[period] || {
          aiRequests: 0,
          tokensUsed: 0,
          costEstimate: 0,
          agentsRun: 0,
          documentsUploaded: 0,
          activeUsers: 0,
        }),
      }));

      return { success: true, data: { history } };
    } catch (error) {
      console.error('Usage service - get history error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get enterprise-wide usage analytics (admin)
   * @param {Object} options - { period }
   * @returns {Promise<Object>} - Platform usage
   */
  async getPlatformUsage(options = {}) {
    try {
      const period = options.period || this._formatPeriod(new Date());

      const usage = await UsageTracking.find({ period });
      const organizations = await Organization.countDocuments({ isActive: true });
      const members = await TeamMember.countDocuments({ status: 'active' });

      const totals = usage.reduce((acc, u) => {
        acc.aiRequests += u.aiRequests || 0;
        acc.tokensUsed += u.tokensUsed || 0;
        acc.apiCalls += u.apiCalls || 0;
        acc.costEstimate += u.costEstimate || 0;
        acc.storageBytes += u.storageBytes || 0;
        acc.agentsRun += u.agentsRun || 0;
        acc.documentsUploaded += u.documentsUploaded || 0;
        acc.activeUsers += u.activeUsers || 0;
        return acc;
      }, {
        aiRequests: 0, tokensUsed: 0, apiCalls: 0, costEstimate: 0,
        storageBytes: 0, agentsRun: 0, documentsUploaded: 0, activeUsers: 0,
      });

      return {
        success: true,
        data: {
          period,
          totals,
          organizations,
          activeMembers: members,
        },
      };
    } catch (error) {
      console.error('Usage service - platform usage error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Check usage limits and add warnings
   * @param {Object} usage - Usage document
   * @param {number} newTokens - New tokens
   */
  async _checkLimits(usage, newTokens) {
    const subscription = await Subscription.findOne({ organizationId: usage.organizationId });
    const limits = subscription?.usageLimits || {};

    const checks = [
      {
        key: 'aiRequests',
        current: usage.aiRequests,
        limit: limits.aiRequestsPerMonth,
        message: 'AI request limit',
      },
      {
        key: 'tokens',
        current: usage.tokensUsed,
        limit: limits.tokensPerMonth,
        message: 'Token usage limit',
      },
    ];

    for (const check of checks) {
      if (check.limit && check.current >= check.limit * 0.8 && check.current < check.limit) {
        usage.warnings.push({
          type: 'warning',
          message: `${check.message}: ${check.current}/${check.limit}`,
          threshold: check.limit * 0.8,
          current: check.current,
          createdAt: new Date(),
        });
      }
      if (check.limit && check.current >= check.limit) {
        usage.warnings.push({
          type: 'limit',
          message: `${check.message} reached: ${check.current}/${check.limit}`,
          threshold: check.limit,
          current: check.current,
          createdAt: new Date(),
        });
      }
    }
  }

  _formatPeriod(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  _serializeUsage(usage) {
    return {
      id: usage._id,
      organizationId: usage.organizationId,
      period: usage.period,
      aiRequests: usage.aiRequests,
      apiCalls: usage.apiCalls,
      tokensUsed: usage.tokensUsed,
      tokensByProvider: usage.tokensByProvider,
      storageBytes: usage.storageBytes,
      documentsUploaded: usage.documentsUploaded,
      agentsRun: usage.agentsRun,
      agentsByType: usage.agentsByType,
      costEstimate: usage.costEstimate,
      activeUsers: usage.activeUsers,
      userActivity: usage.userActivity,
      featureUsage: usage.featureUsage,
      warnings: usage.warnings.slice(-5),
      createdAt: usage.createdAt,
      updatedAt: usage.updatedAt,
    };
  }
}

// Export singleton
const usageService = new UsageService();
module.exports = usageService;
module.exports.UsageService = UsageService;