/**
 * Enterprise Tools
 * Implementations of core tools available to assistant profiles.
 * These are registered with the ToolRegistry and executed by the assistant engine.
 */
const User = require('../../../../../models/User');
const Business = require('../../../../../models/Business');
const Product = require('../../../../../models/Product');
const Skill = require('../../../../../models/Skill');
const Certificate = require('../../../../../models/Certificate');
const HealthcareRecord = require('../../../../../models/HealthcareRecord');

/**
 * Get enterprise statistics
 */
const getEnterpriseStats = {
  name: 'get_enterprise_stats',
  description: 'Get overall enterprise statistics including business counts, product counts, and user metrics.',
  parameters: {
    type: 'object',
    properties: {
      includeDetails: { type: 'boolean', description: 'Include detailed breakdown' },
    },
    required: [],
  },
  handler: async () => {
    const [totalBusinesses, activeBusinesses, totalUsers, totalProducts] = await Promise.all([
      Business.countDocuments(),
      Business.countDocuments({ status: 'active' }),
      User.countDocuments(),
      Product.countDocuments(),
    ]);

    return {
      totalBusinesses,
      activeBusinesses,
      totalUsers,
      totalProducts,
      businessHealth: totalBusinesses > 0
        ? ((activeBusinesses / totalBusinesses) * 100).toFixed(1) + '%'
        : 'N/A',
      timestamp: new Date().toISOString(),
    };
  },
};

/**
 * Get user information
 */
const getUserInfo = {
  name: 'get_user_info',
  description: 'Get information about the current user including role, department, and position.',
  parameters: {
    type: 'object',
    properties: {
      includeProfile: { type: 'boolean', description: 'Include full profile details' },
    },
    required: [],
  },
  handler: async (args = {}, context = {}) => {
    if (!context.userId) {
      return { error: 'User ID not available in context' };
    }
    const user = await User.findById(context.userId).select('name email role department position');
    if (!user) {
      return { error: 'User not found' };
    }
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || 'N/A',
      position: user.position || 'N/A',
    };
  },
};

/**
 * Get user skills
 */
const getSkills = {
  name: 'get_skills',
  description: 'Get the skills associated with the current user.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (args = {}, context = {}) => {
    if (!context.userId) {
      return { error: 'User ID not available in context' };
    }
    const skills = await Skill.find({ user: context.userId }).select('name level category status');
    return {
      total: skills.length,
      skills: skills.map((s) => ({
        name: s.name,
        level: s.level,
        category: s.category || 'general',
        status: s.status || 'active',
      })),
    };
  },
};

/**
 * Get user certificates
 */
const getCertificates = {
  name: 'get_certificates',
  description: 'Get the certificates and certifications associated with the current user.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },
  handler: async (args = {}, context = {}) => {
    if (!context.userId) {
      return { error: 'User ID not available in context' };
    }
    const certs = await Certificate.find({ user: context.userId }).select('title issuer issueDate expiryDate status');
    return {
      total: certs.length,
      certificates: certs.map((c) => ({
        title: c.title,
        issuer: c.issuer || '',
        issueDate: c.issueDate,
        expiryDate: c.expiryDate || null,
        status: c.status || 'valid',
      })),
    };
  },
};

/**
 * Get healthcare records for a user
 */
const getHealthcareRecords = {
  name: 'get_healthcare_records',
  description: 'Get healthcare records for the current user.',
  parameters: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max records to return' },
    },
    required: [],
  },
  handler: async (args = {}, context = {}) => {
    if (!context.userId) {
      return { error: 'User ID not available in context' };
    }
    const limit = Math.min(args.limit || 5, 20);
    const records = await HealthcareRecord.find({ user: context.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('recordType summary findings date');
    return {
      total: records.length,
      records: records.map((r) => ({
        recordType: r.recordType,
        summary: r.summary || '',
        findings: r.findings || [],
        date: r.date || r.createdAt,
      })),
    };
  },
};

/**
 * Generate a report (placeholder - returns report guidance)
 */
const generateReport = {
  name: 'generate_report',
  description: 'Generate a structured report based on the requested topic and data.',
  parameters: {
    type: 'object',
    properties: {
      topic: { type: 'string', description: 'Report topic' },
      format: { type: 'string', description: 'Report format' },
    },
    required: ['topic'],
  },
  handler: async (args = {}) => {
    return {
      topic: args.topic,
      format: args.format || 'markdown',
      status: 'generating',
      note: 'Report generation request received. Full report will be composed in the assistant response.',
    };
  },
};

module.exports = {
  getEnterpriseStats,
  getUserInfo,
  getSkills,
  getCertificates,
  getHealthcareRecords,
  generateReport,
};