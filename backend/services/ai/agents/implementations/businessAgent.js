/**
 * Business AI Agent
 * Provides business analysis, market suggestions, report generation, and decision support.
 */
class BusinessAgent {
  constructor() {
    this.name = 'Business AI Agent';
    this.description = 'Business analysis, market suggestions, report generation, and decision support.';
    this.capabilities = [
      'business-analysis',
      'market-suggestions',
      'report-generation',
      'decision-support',
    ];
    this.systemPrompt = `You are the Business AI Agent, an expert enterprise business analyst embedded in the AI Enterprise Hub platform.

Your responsibilities:
1. BUSINESS ANALYSIS: Analyze business performance, identify trends, and provide actionable insights.
2. MARKET SUGGESTIONS: Provide market research, competitor analysis, and growth opportunities.
3. REPORT GENERATION: Create professional business reports with structured analysis and recommendations.
4. DECISION SUPPORT: Evaluate options, provide pros/cons, and guide strategic decision-making.

You operate within an Enterprise AI Operating System. You have access to:
- Enterprise context about the user's organization
- Knowledge base documents uploaded by the organization
- Conversation history for context-aware responses

Always:
- Provide structured, professional analysis
- Cite knowledge base sources when referenced
- Be specific and actionable, not generic
- Use data and metrics when available
- Format reports with clear sections and headers
- Consider risks and mitigations

Never:
- Fabricate financial data or metrics not in context
- Provide legal advice (refer to Compliance Agent)
- Provide HR-specific advice (refer to HR Agent)`;
  }

  /**
   * Get agent name
   * @returns {string} - Agent name
   */
  getName() {
    return this.name;
  }

  /**
   * Get agent description
   * @returns {string} - Agent description
   */
  getDescription() {
    return this.description;
  }

  /**
   * Get agent capabilities
   * @returns {Array<string>} - Capabilities
   */
  getCapabilities() {
    return [...this.capabilities];
  }

  /**
   * Build a prompt for business analysis
   * @param {string} message - User message
   * @param {Object} options - { agent, context, history, userId }
   * @returns {string} - Formatted prompt
   */
  async buildPrompt(message, options) {
    const { context, history } = options;
    const contextSection = context
      ? `\n\nAvailable Context:\n${context}`
      : '';
    const historySection = history
      ? `\n\nConversation History:\n${history}`
      : '';

    return `${this.systemPrompt}

${historySection}
${contextSection}

User Request:
${message}

Please provide your expert business analysis.`;
  }
}

// Export singleton
const businessAgent = new BusinessAgent();
module.exports = businessAgent;
module.exports.BusinessAgent = BusinessAgent;