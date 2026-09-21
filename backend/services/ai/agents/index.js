/**
 * AI Agent Framework (Phase 7)
 * Enterprise AI Agent architecture: manager, registry, execution engine, memory system.
 */
const agentRegistry = require('./agentRegistry');
const agentMemory = require('./agentMemory');
const agentExecutionEngine = require('./agentExecutionEngine');

/**
 * Agent Manager Service
 * Facade that combines agent registry, memory, and execution engine.
 */
class AgentManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the agent framework
   */
  initialize() {
    if (!this.initialized) {
      agentExecutionEngine.initialize();
      this.initialized = true;
      console.log('AI Agent Framework initialized');
    }
    return true;
  }

  /**
   * Ensure system agents are seeded for a user
   * @param {string} userId - User ID
   */
  async seedSystemAgents(userId) {
    return agentRegistry.seedSystemAgents(userId);
  }

  // ─── Agent Registry API ────────────────────────────────────────────────

  async listAgents(options = {}) {
    return agentRegistry.listAgents(options);
  }

  async getAgent(agentId, userId) {
    return agentRegistry.getAgent(agentId, userId);
  }

  async createAgent(data) {
    return agentRegistry.registerAgent(data);
  }

  async updateAgent(agentId, userId, updates) {
    return agentRegistry.updateAgent(agentId, userId, updates);
  }

  async deleteAgent(agentId, userId) {
    return agentRegistry.deleteAgent(agentId, userId);
  }

  // ─── Agent Execution API ───────────────────────────────────────────────

  /**
   * Run an agent with a user message
   * @param {string} userId - User ID
   * @param {string} agentId - Agent ID
   * @param {string} message - User message
   * @param {Object} options - { sessionId }
   */
  async runAgent(userId, agentId, message, options = {}) {
    return agentExecutionEngine.execute(userId, agentId, message, options);
  }

  /**
   * Get available agent implementations
   */
  getAvailableImplementations() {
    return agentExecutionEngine.getAvailableImplementations();
  }

  // ─── Agent Memory API ──────────────────────────────────────────────────

  async listConversations(options = {}) {
    return agentMemory.listConversations(options);
  }

  async getConversation(conversationId, userId) {
    const AgentConversation = require('../../../models/AgentConversation');
    const conversation = await AgentConversation.findOne({ _id: conversationId, user: userId });
    if (!conversation) return { success: false, message: 'Conversation not found', statusCode: 404 };

    return {
      success: true,
      data: {
        id: conversation._id,
        agentId: conversation.agentId,
        agentType: conversation.agentType,
        title: conversation.title,
        status: conversation.status,
        sessionId: conversation.sessionId,
        context: conversation.context,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    };
  }

  async archiveConversation(conversationId, userId) {
    return agentMemory.archiveConversation(conversationId, userId);
  }

  async deleteConversation(conversationId, userId) {
    return agentMemory.deleteConversation(conversationId, userId);
  }

  // ─── Stats API ─────────────────────────────────────────────────────────

  getStats() {
    return {
      registry: {
        templates: Object.keys(agentRegistry.systemAgentTemplates),
      },
      execution: agentExecutionEngine.getStats(),
    };
  }

  /**
   * Get agent type metadata
   */
  getAgentTypes() {
    return [
      {
        type: 'business',
        name: 'Business AI Agent',
        description: 'Business analysis, market suggestions, report generation, and decision support.',
        capabilities: ['business-analysis', 'market-suggestions', 'report-generation', 'decision-support'],
      },
      {
        type: 'compliance',
        name: 'Compliance AI Agent',
        description: 'Compliance document analysis, risk identification, regulation assistance, and compliance reports.',
        capabilities: ['document-analysis', 'risk-identification', 'regulation-assistance', 'compliance-reports'],
      },
      {
        type: 'hr',
        name: 'HR AI Agent',
        description: 'Resume analysis, candidate evaluation, employee assistance, and HR reports.',
        capabilities: ['resume-analysis', 'candidate-evaluation', 'employee-assistance', 'hr-reports'],
      },
      {
        type: 'customer-support',
        name: 'Customer Support AI Agent',
        description: 'Customer query handling, ticket analysis, and automated responses.',
        capabilities: ['customer-query', 'ticket-analysis', 'automated-responses'],
      },
      {
        type: 'custom',
        name: 'Custom AI Agent',
        description: 'Create a custom AI agent with tailored configuration and permissions.',
        capabilities: ['custom'],
      },
    ];
  }
}

// Export singleton
const agentManager = new AgentManager();

module.exports = agentManager;
module.exports.agentRegistry = agentRegistry;
module.exports.agentMemory = agentMemory;
module.exports.agentExecutionEngine = agentExecutionEngine;