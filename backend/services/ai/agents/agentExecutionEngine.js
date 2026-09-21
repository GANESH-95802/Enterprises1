const queryRouter = require('../orchestrator/queryRouter');
const contextManager = require('../orchestrator/contextManager');
const responseBuilder = require('../orchestrator/responseBuilder');
const retrievalService = require('../rag/retrievalService');
const agentRegistry = require('./agentRegistry');
const agentMemory = require('./agentMemory');
const businessAgent = require('./implementations/businessAgent');
const complianceAgent = require('./implementations/complianceAgent');
const hrAgent = require('./implementations/hrAgent');
const customerSupportAgent = require('./implementations/customerSupportAgent');

/**
 * Agent Execution Engine
 * Routes input to the correct agent implementation, manages conversation flow,
 * retrieves knowledge context, and records run statistics.
 */
class AgentExecutionEngine {
  constructor() {
    this.initialized = false;
    this.stats = { totalExecutions: 0, totalErrors: 0, executionsByType: {} };
    this.implementations = {
      business: businessAgent,
      compliance: complianceAgent,
      hr: hrAgent,
      'customer-support': customerSupportAgent,
    };
  }

  /**
   * Initialize the execution engine
   */
  initialize() {
    if (!this.initialized) {
      console.log('Agent Execution Engine initialized');
      this.initialized = true;
    }
    return true;
  }

  /**
   * Execute an agent prompt with full context and memory
   * @param {string} userId - User ID
   * @param {string} agentId - Agent ID
   * @param {string} message - User message
   * @param {Object} options - { sessionId }
   * @returns {Promise<Object>} - Execution result
   */
  async execute(userId, agentId, message, options = {}) {
    const startTime = Date.now();
    this.stats.totalExecutions += 1;

    try {
      // 1. Get agent and validate
      const agentResult = await agentRegistry.getAgent(agentId, userId);
      if (!agentResult.success) {
        return { success: false, message: agentResult.message };
      }
      const agent = agentResult.data.agent;

      // Check agent is active
      if (agent.status !== 'active') {
        return { success: false, message: `Agent '${agent.name}' is ${agent.status}` };
      }

      // 2. Get/create conversation
      const conversationResult = await agentMemory.getOrCreateConversation(userId, agentId, {
        sessionId: options.sessionId,
      });
      if (!conversationResult.success) {
        return { success: false, message: 'Failed to create conversation session' };
      }
      const conversation = conversationResult.conversation;

      // 3. Save user message
      await agentMemory.saveMessage(conversation._id, {
        role: 'user',
        content: message,
      });

      // 4. Get the agent implementation
      const implementation = this.implementations[agent.type] || this.implementations.business;
      if (!implementation) {
        throw new Error(`No implementation found for agent type: ${agent.type}`);
      }

      // 5. Build context: enterprise context + knowledge base (if enabled)
      const contextParts = [];

      // Enterprise context from Context Manager
      const enterpriseContext = await contextManager.buildQueryContext(userId, { type: `agent-${agent.type}` });
      const enterpriseText = contextManager.contextToPrompt(enterpriseContext);
      if (enterpriseText) {
        contextParts.push(`ENTERPRISE CONTEXT:\n${enterpriseText}`);
      }

      // Knowledge base retrieval (RAG)
      let knowledgeResults = [];
      if (agent.configuration.useKnowledge !== false) {
        const retrieval = await retrievalService.retrieve(userId, message, {
          limit: agent.configuration.knowledgeLimit || 3,
          category: options.knowledgeCategory,
        });
        if (retrieval.success && retrieval.hasKnowledge) {
          contextParts.push(`KNOWLEDGE BASE CONTEXT:\n${retrieval.context}`);
          knowledgeResults = retrieval.results;
        }
      }

      // 6. Get conversation history
      const history = await agentMemory.buildConversationContext(conversation._id);

      // 7. Build the agent prompt
      const prompt = await implementation.buildPrompt(message, {
        agent,
        context: contextParts.join('\n\n'),
        history: history || '',
        userId,
      });

      // 8. Route to AI provider
      const result = await queryRouter.routeChatCompletion(
        [{ role: 'user', content: prompt }],
        {
          provider: agent.configuration.provider === 'auto' ? undefined : agent.configuration.provider,
          model: agent.configuration.model || undefined,
          temperature: agent.configuration.temperature,
          maxTokens: agent.configuration.maxTokens,
        }
      );

      if (!result.success) {
        throw new Error(result.message || 'AI provider request failed');
      }

      const content = result.text || result.message || '';

      // 9. Save agent response
      await agentMemory.saveMessage(conversation._id, {
        role: 'agent',
        content,
        tokensUsed: result.usage?.totalTokens || 0,
        metadata: {
          provider: result.provider,
          model: result.model,
          agentType: agent.type,
        },
      });

      // 10. Update conversation title if first message
      if (conversation.messages.length <= 2) {
        conversation.title = this._generateTitle(message, agent.name);
        conversation.agentType = agent.type;
        await conversation.save();
      }

      // 11. Record run stats
      const latencyMs = Date.now() - startTime;
      await agentRegistry.recordRunStats(agentId, {
        tokensUsed: result.usage?.totalTokens || 0,
        latencyMs,
        success: true,
      });

      // Track stats
      this.stats.executionsByType[agent.type] = (this.stats.executionsByType[agent.type] || 0) + 1;

      return {
        success: true,
        data: {
          response: content,
          conversationId: conversation._id,
          sessionId: conversation.sessionId,
          agentId,
          agentType: agent.type,
          agentName: agent.name,
          provider: result.provider || 'unknown',
          model: result.model || 'unknown',
          knowledgeUsed: knowledgeResults.length > 0,
          knowledgeResults: knowledgeResults.map((r) => ({
            documentTitle: r.metadata?.documentTitle || '',
            score: r.score || 0,
            snippet: (r.content || '').substring(0, 150),
          })),
          usage: result.usage || null,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.stats.totalErrors += 1;
      console.error('Agent execution engine - execute error:', error.message);

      // Record failure
      await agentRegistry.recordRunStats(agentId, {
        latencyMs: Date.now() - startTime,
        success: false,
      }).catch(() => {});

      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Get available agent implementations
   * @returns {Array<Object>} - Available implementations
   */
  getAvailableImplementations() {
    return Object.keys(this.implementations).map((type) => ({
      type,
      name: this.implementations[type].getName(),
      description: this.implementations[type].getDescription(),
      capabilities: this.implementations[type].getCapabilities(),
    }));
  }

  /**
   * Get engine statistics
   * @returns {Object} - Stats
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Generate a conversation title from the first message
   * @param {string} message - User message
   * @param {string} agentName - Agent name
   * @returns {string} - Generated title
   */
  _generateTitle(message, agentName) {
    const truncated = message.length > 50 ? `${message.substring(0, 47)}...` : message;
    return `${agentName}: ${truncated}`;
  }
}

// Export singleton
const agentExecutionEngine = new AgentExecutionEngine();

module.exports = agentExecutionEngine;
module.exports.AgentExecutionEngine = AgentExecutionEngine;