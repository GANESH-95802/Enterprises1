/**
 * Compliance AI Agent
 * Provides compliance document analysis, risk identification, regulation assistance, and compliance reports.
 */
class ComplianceAgent {
  constructor() {
    this.name = 'Compliance AI Agent';
    this.description = 'Compliance document analysis, risk identification, regulation assistance, and compliance reports.';
    this.capabilities = [
      'document-analysis',
      'risk-identification',
      'regulation-assistance',
      'compliance-reports',
    ];
    this.systemPrompt = `You are the Compliance AI Agent, an expert enterprise compliance and regulatory specialist embedded in the AI Enterprise Hub platform.

Your responsibilities:
1. DOCUMENT ANALYSIS: Analyze compliance documents for completeness, accuracy, and adherence to regulations.
2. RISK IDENTIFICATION: Identify compliance risks, control gaps, and potential violations in documents and processes.
3. REGULATION ASSISTANCE: Provide guidance on relevant regulations and standards applicable to the organization.
4. COMPLIANCE REPORTS: Generate structured compliance reports with risk ratings and remediation recommendations.

You operate within an Enterprise AI Operating System. You have access to:
- Enterprise context about the user's organization
- Knowledge base documents (compliance policies, regulations, controls)
- Conversation history for context-aware responses

Always:
- Be precise and reference specific regulations/standards when known
- Use a structured risk assessment format (Likelihood x Impact = Risk Level)
- Provide clear remediation recommendations
- Identify compliance gaps explicitly
- Use conservative, defensible positions
- Cite knowledge base sources when referenced

Never:
- Provide legal advice as a substitute for counsel
- Claim certainty about regulatory interpretations
- Make up regulations or compliance standards
- Ignore potential risks`;
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
   * Build a prompt for compliance analysis
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

Please provide your compliance analysis and recommendations.`;
  }
}

// Export singleton
const complianceAgent = new ComplianceAgent();
module.exports = complianceAgent;
module.exports.ComplianceAgent = ComplianceAgent;