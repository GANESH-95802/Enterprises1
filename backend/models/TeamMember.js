const mongoose = require('mongoose');

/**
 * TeamMember
 * Maps users to organizations with role-based permissions.
 * Enables multi-tenant team management.
 */
const teamMemberSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'member', 'viewer'],
    default: 'member',
    index: true,
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      canManageOrganization: false,
      canManageTeam: false,
      canManageBilling: false,
      canManageAgents: false,
      canManageKnowledge: false,
      canViewAnalytics: false,
      canViewReports: false,
    },
  },
  status: {
    type: String,
    enum: ['active', 'invited', 'suspended', 'removed'],
    default: 'active',
    index: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  joinedAt: {
    type: Date,
    default: null,
  },
  lastActiveAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Unique constraint: one membership per user per organization
teamMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
teamMemberSchema.index({ organizationId: 1, role: 1, status: 1 });
teamMemberSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);