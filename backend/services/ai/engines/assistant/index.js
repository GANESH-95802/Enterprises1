/**
 * Assistant Engine - Enterprise AI Assistant Engine.
 * Uses Phase 1 orchestrator, memory, context, query router, and middleware.
 */
const orchestrator = require('../../orchestrator');
const queryRouter = require('../../orchestrator/queryRouter');
const contextManager = require('../../orchestrator/contextManager');
const memoryManager = require('../../orchestrator/memoryManager');
const responseBuilder = require('../../orchestrator/responseBuilder');
const { getProfileConfig, listProfiles, isToolAllowed } = require('./profiles');
const { listTemplates, renderTemplate } = require('./templates');
const sessionManager = require('./sessionManager');
const toolRegistry = require('./tools');
const { initStream } = require('./streaming');
const retrievalService = require('../../rag/retrievalService');

class AssistantEngine {
  constructor() {
    this.stats = { totalMessages: 0, toolCalls: 0, streamingSessions: 0, errors: 0 };
  }

  initialize() {
    if (!orchestrator.initialized) orchestrator.initialize();
    console.log('Assistant Engine initialized');
    return true;
  }

  /**
   * Build session, context, and messages for a request
   */
  async _buildRequest(userId, message, options = {}) {
    const profileId = options.profile || 'general';
    const profileConfig = getProfileConfig(profileId, {
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    const sessionResult = await sessionManager.getOrCreateSession(userId, {
      sessionId: options.sessionId,
      profile: profileId,
    });
    if (!sessionResult.success) {
      throw new Error('Failed to create conversation session');
    }
    const session = sessionResult.session;
    const sessionId = session.sessionId;

    const context = await contextManager.buildQueryContext(userId, { type: 'assistant' });
    const contextText = contextManager.contextToPrompt(context);
    const history = await memoryManager.getContextWindow(userId, sessionId);

    // Phase 3A: Retrieve knowledge base context when RAG is enabled
    // Preserves full backward compatibility — retrieval is optional.
    let knowledgeContext = '';
    if (options.useKnowledge) {
      const retrieval = await retrievalService.retrieve(userId, message, {
        limit: options.knowledgeLimit || 3,
        category: options.knowledgeCategory,
        minScore: options.knowledgeMinScore,
      });
      if (retrieval.success && retrieval.hasKnowledge) {
        knowledgeContext = retrieval.context;
      }
    }

    const combinedContext = knowledgeContext
      ? `${contextText}\n\nKNOWLEDGE BASE:\n${knowledgeContext}`
      : contextText;

    const rendered = renderTemplate(profileConfig.template, {
      context: combinedContext,
      history: history.length > 0
        ? history.map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`).join('\n')
        : '',
      query: message,
    });

    const messages = [];
    if (rendered.system) messages.push({ role: 'system', content: rendered.system });
    for (const h of history.slice(-5)) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
    messages.push({ role: 'user', content: message });

    return { profileId, profileConfig, sessionId, messages };
  }

  /**
   * Send a chat message to the assistant
   */
  async chat(userId, message, options = {}) {
    this.stats.totalMessages += 1;
    const profileId = options.profile || 'general';

    try {
      const { sessionId, messages } = await this._buildRequest(userId, message, {
        profile: profileId,
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        useKnowledge: options.useKnowledge,
        knowledgeLimit: options.knowledgeLimit,
        knowledgeCategory: options.knowledgeCategory,
        knowledgeMinScore: options.knowledgeMinScore,
      });

      const profileConfig = getProfileConfig(profileId, {
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      // Route via the existing Query Router (Gemini + OpenAI fallback)
      const result = await queryRouter.routeChatCompletion(messages, {
        provider: profileConfig.provider === 'auto' ? undefined : profileConfig.provider,
        model: profileConfig.model || undefined,
        temperature: profileConfig.temperature,
        maxTokens: profileConfig.maxTokens,
      });

      if (!result.success) {
        throw new Error(result.message || 'AI provider request failed');
      }

      const assistantContent = result.text || result.message || '';

      // Save to memory via Phase 1 Memory Manager
      await memoryManager.saveMessage({ userId, role: 'user', content: message, sessionId });
      await memoryManager.saveMessage({
        userId, role: 'assistant', content: assistantContent, sessionId,
        metadata: { profile: profileId, provider: result.provider, model: result.model, usage: result.usage },
      });

      await sessionManager.touchSession(userId, sessionId);

      return {
        success: true,
        data: {
          sessionId, message: assistantContent,
          provider: result.provider || 'unknown', model: result.model || 'unknown',
          profile: profileId, timestamp: new Date().toISOString(), usage: result.usage || null,
        },
      };
    } catch (error) {
      this.stats.errors += 1;
      console.error('Assistant Engine - chat error:', error.message);
      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Chat with tool calling support
   */
  async chatWithTools(userId, message, options = {}) {
    this.stats.totalMessages += 1;
    const profileId = options.profile || 'general';

    try {
      const { sessionId, messages } = await this._buildRequest(userId, message, {
        profile: profileId,
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        useKnowledge: options.useKnowledge,
        knowledgeLimit: options.knowledgeLimit,
        knowledgeCategory: options.knowledgeCategory,
        knowledgeMinScore: options.knowledgeMinScore,
      });

      const profileConfig = getProfileConfig(profileId, {
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      const result = await queryRouter.routeChatCompletion(messages, {
        provider: profileConfig.provider === 'auto' ? undefined : profileConfig.provider,
        model: profileConfig.model || undefined,
        temperature: profileConfig.temperature,
        maxTokens: profileConfig.maxTokens,
      });

      if (!result.success) throw new Error(result.message || 'AI provider request failed');

      const content = result.text || result.message || '';
      const toolCalls = [];

      // Detect tool call pattern in response
      const toolCallPattern = /\{\s*"tool"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{.*?\})\s*\}/s;
      const toolMatch = content.match(toolCallPattern);

      if (toolMatch && toolRegistry.has(toolMatch[1]) && isToolAllowed(profileId, toolMatch[1])) {
        const toolName = toolMatch[1];
        let args = {};
        try { args = JSON.parse(toolMatch[2]); } catch { /* keep empty */ }
        const toolResult = await toolRegistry.execute(toolName, args, { userId, sessionId });
        this.stats.toolCalls += 1;
        toolCalls.push({ toolName, arguments: args, result: toolResult });
      }

      await memoryManager.saveMessage({ userId, role: 'user', content: message, sessionId });
      await memoryManager.saveMessage({
        userId, role: 'assistant', content, sessionId,
        metadata: { profile: profileId, provider: result.provider, model: result.model, toolCalls: toolCalls.length },
      });

      await sessionManager.touchSession(userId, sessionId);

      return {
        success: true,
        data: {
          sessionId, message: content,
          provider: result.provider || 'unknown', model: result.model || 'unknown',
          profile: profileId, toolCalls,
          timestamp: new Date().toISOString(), usage: result.usage || null,
        },
      };
    } catch (error) {
      this.stats.errors += 1;
      console.error('Assistant Engine - chatWithTools error:', error.message);
      return responseBuilder.buildError(error.message);
    }
  }

  /**
   * Stream a chat response via SSE
   */
  async streamChat(res, userId, message, options = {}) {
    this.stats.totalMessages += 1;
    this.stats.streamingSessions += 1;
    const profileId = options.profile || 'general';

    try {
      const { sessionId, messages } = await this._buildRequest(userId, message, {
        profile: profileId,
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        useKnowledge: options.useKnowledge,
        knowledgeLimit: options.knowledgeLimit,
        knowledgeCategory: options.knowledgeCategory,
        knowledgeMinScore: options.knowledgeMinScore,
      });

      const profileConfig = getProfileConfig(profileId, {
        provider: options.provider,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      const stream = initStream(res, { sessionId, profile: profileId });

      const result = await queryRouter.routeChatCompletion(messages, {
        provider: profileConfig.provider === 'auto' ? undefined : profileConfig.provider,
        model: profileConfig.model || undefined,
        temperature: profileConfig.temperature,
        maxTokens: profileConfig.maxTokens,
      });

      if (!result.success) throw new Error(result.message || 'AI provider request failed');

      const content = result.text || result.message || '';
      const chunkSize = 80;
      for (let i = 0; i < content.length; i += chunkSize) {
        stream.sendChunk(content.substring(i, i + chunkSize));
      }

      await memoryManager.saveMessage({ userId, role: 'user', content: message, sessionId });
      await memoryManager.saveMessage({
        userId, role: 'assistant', content, sessionId,
        metadata: { profile: profileId, provider: result.provider, model: result.model, usage: result.usage },
      });

      await sessionManager.touchSession(userId, sessionId);

      stream.end({ provider: result.provider, model: result.model, usage: result.usage });
    } catch (error) {
      this.stats.errors += 1;
      console.error('Assistant Engine - streamChat error:', error.message);
      try {
        const stream = initStream(res, { profile: profileId });
        stream.error(error.message);
      } catch { /* response may already be sent */ }
    }
  }

  getProfiles() { return listProfiles(); }
  getTemplates() { return listTemplates(); }
  getTools() { return toolRegistry.list(); }
  getStats() { return { ...this.stats }; }
}

const assistantEngine = new AssistantEngine();
module.exports = assistantEngine;
module.exports.AssistantEngine = AssistantEngine;