const AiAgent = require('../../../models/AiAgent');

/**
 * Agent Registry
 * Manages the registration and discovery of AI Agents.
 * Provides CRUD operations for agents and system agent seeding.
 */
class AgentRegistry {
  constructor() {
    this.systemAgentTemplates = {
      business: {
        name: 'Business AI Agent',
        type: 'business',
        description: 'Business analysis, market suggestions, report generation, and decision support.',
        configuration: {
          provider: 'auto',
          model: '',
          temperature: 0.7,
          maxTokens: 2048,
          useKnowledge: true,
          knowledgeLimit: 3,
          tools: ['business-analysis', 'market-suggestions', 'report-generation', 'decision-support'],
          capabilities: ['business-analysis', 'market-suggestions', 'report-generation', 'decision-support'],
        },
        permissions: {
          roles: ['admin', 'manager', 'user'],
          dataAccess: ['own-organization'],
          canReadDocuments: true,
          canQueryKnowledge: true,
          canRunReports: true,
        },
        isSystem: true,
      },
      compliance: {
        name: 'Compliance AI Agent',
        type: 'compliance',
        description: 'Compliance document analysis, risk identification, regulation assistance, and compliance reports.',
        configuration: {
          provider: 'auto',
          model: '',
          temperature: 0.3,
          maxTokens: 2048,
          useKnowledge: true,
          knowledgeLimit: 4,
          tools: ['document-analysis', 'risk-identification', 'regulation-assistance', 'compliance-reports'],
          capabilities: ['document-analysis', 'risk-identification', 'regulation-assistance', 'compliance-reports'],
        },
        permissions: {
          roles: ['admin', 'manager'],
          dataAccess: ['own-organization'],
          canReadDocuments: true,
          canQueryKnowledge: true,
          canRunReports: true,
        },
        isSystem: true,
      },
      hr: {
        name: 'HR AI Agent',
        type: 'hr',
        description: 'Resume analysis, candidate evaluation, employee assistance, and HR reports.',
        configuration: {
          provider: 'auto',
          model: '',
          temperature: 0.5,
          maxTokens: 2048,
          useKnowledge: true,
          knowledgeLimit: 3,
          tools: ['resume-analysis', 'candidate-evaluation', 'employee-assistance', 'hr-reports'],
          capabilities: ['resume-analysis', 'candidate-evaluation', 'employee-assistance', 'hr-reports'],
        },
        permissions: {
          roles: ['admin', 'manager'],
          dataAccess: ['own-organization'],
          canReadDocuments: true,
          canQueryKnowledge: true,
          canRunReports: true,
        },
        isSystem: true,
      },
      'customer-support': {
        name: 'Customer Support AI Agent',
        type: 'customer-support',
        description: 'Customer query handling, ticket analysis, and automated responses.',
        configuration: {
          provider: 'auto',
          model: '',
          temperature: 0.7,
          maxTokens: 1024,
          useKnowledge: true,
          knowledgeLimit: 5,
          tools: ['customer-query', 'ticket-analysis', 'automated-responses'],
          capabilities: ['customer-query', 'ticket-analysis', 'automated-responses'],
        },
        permissions: {
          roles: ['admin', 'manager', 'user'],
          dataAccess: ['own-organization'],
          canReadDocuments: true,
          canQueryKnowledge: true,
          canRunReports: false,
        },
        isSystem: true,
      },
    };
  }

  /**
   * Seed system agents for a user (creates defaults on first use)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - { success, agents }
   */
  async seedSystemAgents(userId) {
    try {
      const results = [];

      for (const [type, template] of Object.entries(this.systemAgentTemplates)) {
        const existing = await AiAgent.findOne({ type, createdBy: userId, isSystem: true });
        if (!existing) {
          const agent = await AiAgent.create({
            ...template,
            createdBy: userId,
          });
          results.push(agent);
        } else {
          results.push(existing);
        }
      }

      return { success: true, data: { agents: results } };
    } catch (error) {
      console.error('Agent registry - seed error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Register a new AI Agent
   * @param {Object} data - Agent data
   * @returns {Promise<Object>} - Registered agent
   */
  async registerAgent(data) {
    try {
      const agent = await AiAgent.create({
        name: data.name,
        type: data.type,
        description: data.description || '',
        configuration: data.configuration || {},
        permissions: data.permissions || {},
        organizationId: data.organizationId || null,
        createdBy: data.createdBy,
      });

      return { success: true, data: { agent } };
    } catch (error) {
      console.error('Agent registry - register error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get all agents (optionally filtered by user/type/organization)
   * @param {Object} options - { userId, type, status, organizationId }
   * @returns {Promise<Object>} - { success, data: { agents } }
   */
  async listAgents(options = {}) {
    try {
      const query = {};
      if (options.type) query.type = options.type;
      if (options.status) query.status = options.status;
      if (options.organizationId) query.organizationId = options.organizationId;
      if (options.createdBy) query.createdBy = options.createdBy;

      // If no filter, show system agents + user's custom agents
      if (!options.organizationId && !options.createdBy && !options.type && !options.status) {
        query.$or = [
          { isSystem: true },
          { createdBy: options.userId },
        ];
      }

      const agents = await AiAgent.find(query)
        .sort({ createdAt: -1 })
        .limit(Math.min(options.limit || 50, 100));

      return {
        success: true,
        data: {
          agents: agents.map(this._serializeAgent),
          total: agents.length,
        },
      };
    } catch (error) {
      console.error('Agent registry - list error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get a single agent by ID (with authorization)
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>} - Agent or error
   */
  async getAgent(agentId, userId) {
    try {
      const agent = await AiAgent.findOne({ _id: agentId });
      if (!agent) return { success: false, message: 'Agent not found', statusCode: 404 };

      // Allow system agents or agents created by the user
      if (!agent.isSystem && agent.createdBy.toString() !== userId.toString()) {
        return { success: false, message: 'Not authorized to access this agent', statusCode: 403 };
      }

      return { success: true, data: { agent: this._serializeAgent(agent) } };
    } catch (error) {
      console.error('Agent registry - get error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update an agent
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} - Updated agent
   */
  async updateAgent(agentId, userId, updates = {}) {
    try {
      const agent = await AiAgent.findOne({ _id: agentId });
      if (!agent) return { success: false, message: 'Agent not found', statusCode: 404 };

      // Only owner or system agents can be updated by admin/manager
      if (!agent.isSystem && agent.createdBy.toString() !== userId.toString()) {
        return { success: false, message: 'Not authorized to update this agent', statusCode: 403 };
      }

      if (updates.name !== undefined) agent.name = updates.name;
      if (updates.description !== undefined) agent.description = updates.description;
      if (updates.status !== undefined) agent.status = updates.status;
      if (updates.configuration !== undefined) agent.configuration = { ...agent.configuration, ...updates.configuration };
      if (updates.permissions !== undefined) agent.permissions = { ...agent.permissions, ...updates.permissions };

      await agent.save();

      return { success: true, data: { agent: this._serializeAgent(agent) } };
    } catch (error) {
      console.error('Agent registry - update error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Delete an agent
   * @param {string} agentId - Agent ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteAgent(agentId, userId) {
    try {
      const agent = await AiAgent.findOne({ _id: agentId });
      if (!agent) return { success: false, message: 'Agent not found', statusCode: 404 };

      if (agent.isSystem) {
        return { success: false, message: 'System agents cannot be deleted', statusCode: 400 };
      }

      if (agent.createdBy.toString() !== userId.toString()) {
        return { success: false, message: 'Not authorized to delete this agent', statusCode: 403 };
      }

      await AiAgent.deleteOne({ _id: agentId });

      // Also clean up conversations
      const AgentConversation = require('../../../models/AgentConversation');
      await AgentConversation.deleteMany({ agentId }).catch(() => {});

      return { success: true, message: 'Agent deleted' };
    } catch (error) {
      console.error('Agent registry - delete error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Track a run statistic
   * @param {string} agentId - Agent ID
   * @param {Object} runStats - { tokensUsed, latencyMs, success }
   * @returns {Promise<void>}
   */
  async recordRunStats(agentId, { tokensUsed = 0, latencyMs = 0, success = true }) {
    try {
      const agent = await AiAgent.findById(agentId);
      if (!agent) return;

      const stats = agent.stats || {};
      const totalRuns = (stats.totalRuns || 0) + 1;
      const totalTokens = (stats.totalTokens || 0) + tokensUsed;
      const totalErrors = (stats.totalErrors || 0) + (success ? 0 : 1);
      const avgLatencyMs = stats.avgLatencyMs
        ? Math.round(((stats.avgLatencyMs * (totalRuns - 1)) + latencyMs) / totalRuns)
        : latencyMs;

      agent.stats = {
        totalRuns,
        totalTokens,
        totalErrors,
        avgLatencyMs,
        lastRunAt: new Date(),
      };
      await agent.save();
    } catch (error) {
      console.error('Agent registry - record stats error:', error.message);
    }
  }

  /**
   * Serialize agent for API response
   * @param {Object} agent - Mongoose agent document
   * @returns {Object} - Serialized agent
   */
  _serializeAgent(agent) {
    return {
      id: agent._id,
      name: agent.name,
      type: agent.type,
      description: agent.description,
      status: agent.status,
      version: agent.version,
      configuration: agent.configuration,
      permissions: agent.permissions,
      stats: agent.stats,
      isSystem: agent.isSystem,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}

// Export singleton
const agentRegistry = new AgentRegistry();

module.exports = agentRegistry;
module.exports.AgentRegistry = AgentRegistry;