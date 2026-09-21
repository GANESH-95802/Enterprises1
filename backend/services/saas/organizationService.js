const Organization = require('../../models/Organization');
const TeamMember = require('../../models/TeamMember');
const Subscription = require('../../models/Subscription');
const Invitation = require('../../models/Invitation');
const crypto = require('crypto');

/**
 * Organization Service
 * Manages multi-tenant organizations, team members, and onboarding.
 */
class OrganizationService {
  constructor() {
    this.planDefinitions = {
      free: {
        name: 'Free',
        price: 0,
        usageLimits: {
          aiRequestsPerMonth: 100,
          tokensPerMonth: 100000,
          storageMb: 1024,
          maxAgents: 3,
          maxUsers: 5,
          maxDocuments: 50,
        },
        features: {
          allAgents: false,
          customAgents: false,
          advancedAnalytics: false,
          prioritySupport: false,
          apiAccess: false,
          ssoEnabled: false,
        },
      },
      professional: {
        name: 'Professional',
        price: 49,
        usageLimits: {
          aiRequestsPerMonth: 5000,
          tokensPerMonth: 5000000,
          storageMb: 10240,
          maxAgents: 10,
          maxUsers: 25,
          maxDocuments: 500,
        },
        features: {
          allAgents: true,
          customAgents: true,
          advancedAnalytics: true,
          prioritySupport: true,
          apiAccess: true,
          ssoEnabled: false,
        },
      },
      enterprise: {
        name: 'Enterprise',
        price: 199,
        usageLimits: {
          aiRequestsPerMonth: 50000,
          tokensPerMonth: 50000000,
          storageMb: 102400,
          maxAgents: 100,
          maxUsers: 1000,
          maxDocuments: 10000,
        },
        features: {
          allAgents: true,
          customAgents: true,
          advancedAnalytics: true,
          prioritySupport: true,
          apiAccess: true,
          ssoEnabled: true,
        },
      },
    };
  }

  /**
   * Register a new company/organization
   * @param {Object} data - { companyName, industry, description, size, ownerId }
   * @returns {Promise<Object>} - Created organization with subscription
   */
  async registerOrganization(data) {
    try {
      const { companyName, industry, description, size, ownerId } = data;

      // Check if user already owns an organization
      const existingOrg = await Organization.findOne({ owner: ownerId });
      if (existingOrg) {
        return { success: false, message: 'User already owns an organization' };
      }

      // Create organization
      const organization = await Organization.create({
        companyName,
        industry: industry || '',
        description: description || '',
        size: size || 'small',
        owner: ownerId,
        createdBy: ownerId,
        users: [ownerId],
        subscriptionPlan: 'free',
        usageLimits: this.planDefinitions.free.usageLimits,
      });

      // Create default subscription
      const subscription = await Subscription.create({
        organizationId: organization._id,
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        paymentStatus: 'unpaid',
        usageLimits: this.planDefinitions.free.usageLimits,
        features: this.planDefinitions.free.features,
        price: 0,
      });

      organization.subscription = subscription._id;
      await organization.save();

      // Create owner team member
      await TeamMember.create({
        organizationId: organization._id,
        userId: ownerId,
        role: 'owner',
        status: 'active',
        joinedAt: new Date(),
        permissions: {
          canManageOrganization: true,
          canManageTeam: true,
          canManageBilling: true,
          canManageAgents: true,
          canManageKnowledge: true,
          canViewAnalytics: true,
          canViewReports: true,
        },
      });

      return {
        success: true,
        data: {
          organization: this._serializeOrganization(organization),
          subscription: this._serializeSubscription(subscription),
        },
      };
    } catch (error) {
      console.error('Organization service - register error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get organization by ID
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Organization
   */
  async getOrganization(organizationId) {
    try {
      const organization = await Organization.findById(organizationId);
      if (!organization) return { success: false, message: 'Organization not found', statusCode: 404 };

      const subscription = organization.subscription
        ? await Subscription.findById(organization.subscription)
        : null;

      return {
        success: true,
        data: {
          organization: this._serializeOrganization(organization),
          subscription: subscription ? this._serializeSubscription(subscription) : null,
        },
      };
    } catch (error) {
      console.error('Organization service - get error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get organization by member user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Organization(s) the user belongs to
   */
  async getOrganizationsForUser(userId) {
    try {
      const memberships = await TeamMember.find({ userId, status: 'active' });
      const organizationIds = memberships.map((m) => m.organizationId);

      const organizations = await Organization.find({ _id: { $in: organizationIds } });
      const memberMap = {};
      for (const m of memberships) {
        memberMap[String(m.organizationId)] = m;
      }

      return {
        success: true,
        data: {
          organizations: organizations.map((org) => ({
            ...this._serializeOrganization(org),
            membership: {
              role: memberMap[String(org._id)]?.role || 'member',
              status: memberMap[String(org._id)]?.status || 'active',
            },
          })),
        },
      };
    } catch (error) {
      console.error('Organization service - list for user error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update organization profile
   * @param {string} organizationId - Organization ID
   * @param {Object} updates - { companyName, industry, description, size, logo, settings }
   * @param {Object} actor - { userId, role }
   * @returns {Promise<Object>} - Updated organization
   */
  async updateOrganization(organizationId, updates, actor = {}) {
    try {
      // Check permission
      if (!['owner', 'admin'].includes(actor.role)) {
        return { success: false, message: 'Not authorized to update organization settings', statusCode: 403 };
      }

      const organization = await Organization.findById(organizationId);
      if (!organization) return { success: false, message: 'Organization not found', statusCode: 404 };

      if (updates.companyName !== undefined) organization.companyName = updates.companyName;
      if (updates.industry !== undefined) organization.industry = updates.industry;
      if (updates.description !== undefined) organization.description = updates.description;
      if (updates.size !== undefined) organization.size = updates.size;
      if (updates.logo !== undefined) organization.logo = updates.logo;
      if (updates.settings !== undefined) organization.settings = { ...organization.settings, ...updates.settings };

      await organization.save();

      return { success: true, data: { organization: this._serializeOrganization(organization) } };
    } catch (error) {
      console.error('Organization service - update error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * List team members for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Team members
   */
  async listTeamMembers(organizationId) {
    try {
      const members = await TeamMember.find({ organizationId, status: { $ne: 'removed' } })
        .populate('userId', 'name email role avatar')
        .sort({ role: 1, createdAt: 1 });

      return {
        success: true,
        data: {
          members: members.map((m) => ({
            id: m._id,
            user: m.userId,
            role: m.role,
            status: m.status,
            permissions: m.permissions,
            joinedAt: m.joinedAt,
            lastActiveAt: m.lastActiveAt,
            createdAt: m.createdAt,
          })),
          total: members.length,
        },
      };
    } catch (error) {
      console.error('Organization service - list team error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Invite a user to the organization
   * @param {Object} data - { organizationId, email, role, invitedBy }
   * @returns {Promise<Object>} - Invitation
   */
  async inviteMember(data) {
    try {
      const { organizationId, email, role, invitedBy } = data;

      // Check subscription user limits
      const subscription = await Subscription.findOne({ organizationId });
      const memberCount = await TeamMember.countDocuments({ organizationId, status: { $ne: 'removed' } });
      const maxUsers = subscription?.usageLimits?.maxUsers || 5;
      if (memberCount >= maxUsers) {
        return { success: false, message: `User limit reached (${maxUsers}). Upgrade your plan for more users.` };
      }

      // Check existing pending invitation
      const existing = await Invitation.findOne({ organizationId, email, status: 'pending' });
      if (existing) {
        return { success: false, message: 'Invitation already pending for this email' };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await Invitation.create({
        organizationId,
        email,
        role: role || 'member',
        token,
        invitedBy,
        expiresAt,
      });

      return {
        success: true,
        data: {
          invitation: {
            id: invitation._id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
          },
        },
      };
    } catch (error) {
      console.error('Organization service - invite error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update member role/permissions
   * @param {string} organizationId - Organization ID
   * @param {string} memberId - Team member ID
   * @param {Object} updates - { role, permissions, status }
   * @param {Object} actor - { role }
   * @returns {Promise<Object>} - Updated member
   */
  async updateMember(organizationId, memberId, updates = {}, actor = {}) {
    try {
      if (actor.role !== 'owner' && actor.role !== 'admin') {
        return { success: false, message: 'Not authorized to manage team members', statusCode: 403 };
      }

      const member = await TeamMember.findOne({ _id: memberId, organizationId });
      if (!member) return { success: false, message: 'Member not found', statusCode: 404 };

      // Prevent owner from being demoted by non-owner
      if (member.role === 'owner' && actor.role !== 'owner') {
        return { success: false, message: 'Only the organization owner can modify the owner role', statusCode: 403 };
      }

      if (updates.role !== undefined) member.role = updates.role;
      if (updates.status !== undefined) member.status = updates.status;
      if (updates.permissions !== undefined) {
        member.permissions = { ...member.permissions, ...updates.permissions };
      }

      await member.save();

      return { success: true, data: { member } };
    } catch (error) {
      console.error('Organization service - update member error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Remove a team member
   * @param {string} organizationId - Organization ID
   * @param {string} memberId - Team member ID
   * @param {Object} actor - { role }
   * @returns {Promise<Object>} - Result
   */
  async removeMember(organizationId, memberId, actor = {}) {
    try {
      if (actor.role !== 'owner' && actor.role !== 'admin') {
        return { success: false, message: 'Not authorized to remove team members', statusCode: 403 };
      }

      const member = await TeamMember.findOne({ _id: memberId, organizationId });
      if (!member) return { success: false, message: 'Member not found', statusCode: 404 };

      if (member.role === 'owner') {
        return { success: false, message: 'Cannot remove the organization owner', statusCode: 403 };
      }

      member.status = 'removed';
      await member.save();

      // Remove user from organization users array
      await Organization.updateOne(
        { _id: organizationId },
        { $pull: { users: member.userId } }
      );

      return { success: true, message: 'Member removed' };
    } catch (error) {
      console.error('Organization service - remove member error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get plan definitions for pricing
   * @returns {Object} - Plan definitions
   */
  getPlans() {
    return {
      free: this.planDefinitions.free,
      professional: this.planDefinitions.professional,
      enterprise: this.planDefinitions.enterprise,
    };
  }

  /**
   * Get usage limits for a plan
   * @param {string} plan - Plan name
   * @returns {Object} - Usage limits
   */
  getPlanLimits(plan) {
    return this.planDefinitions[plan]?.usageLimits || this.planDefinitions.free.usageLimits;
  }

  _serializeOrganization(org) {
    return {
      id: org._id,
      companyName: org.companyName,
      industry: org.industry,
      logo: org.logo,
      description: org.description,
      size: org.size,
      owner: org.owner,
      users: org.users,
      settings: org.settings,
      subscriptionPlan: org.subscriptionPlan,
      usageLimits: org.usageLimits,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  _serializeSubscription(sub) {
    return {
      id: sub._id,
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate,
      expiryDate: sub.expiryDate,
      trialEndsAt: sub.trialEndsAt,
      paymentStatus: sub.paymentStatus,
      billingCycle: sub.billingCycle,
      price: sub.price,
      currency: sub.currency,
      usageLimits: sub.usageLimits,
      features: sub.features,
    };
  }
}

// Export singleton
const organizationService = new OrganizationService();
module.exports = organizationService;
module.exports.OrganizationService = OrganizationService;