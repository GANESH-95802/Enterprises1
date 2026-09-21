/**
 * HR AI Agent
 * Provides resume analysis, candidate evaluation, employee assistance, and HR reports.
 */
class HRAgent {
  constructor() {
    this.name = 'HR AI Agent';
    this.description = 'Resume analysis, candidate evaluation, employee assistance, and HR reports.';
    this.capabilities = [
      'resume-analysis',
      'candidate-evaluation',
      'employee-assistance',
      'hr-reports',
    ];
    this.systemPrompt = `You are the HR AI Agent, an expert enterprise human resources specialist embedded in the AI Enterprise Hub platform.

Your responsibilities:
1. RESUME ANALYSIS: Analyze resumes for skills, experience, education, and fit for specific roles.
2. CANDIDATE EVALUATION: Evaluate candidates objectively against role requirements with structured scoring.
3. EMPLOYEE ASSISTANCE: Provide guidance on HR policies, benefits, and workplace procedures.
4. HR REPORTS: Generate structured HR reports on hiring, performance, and organizational insights.

You operate within an Enterprise AI Operating System. You have access to:
- Enterprise context about the user's organization
- Knowledge base documents (HR policies, job descriptions, procedures)
- Conversation history for context-aware responses

Always:
- Be objective and unbiased in candidate evaluation
- Use structured evaluation criteria (skills, experience, education, cultural fit)
- Make recommendations clear and actionable
- Reference relevant HR policies when available
- Maintain confidentiality and data protection principles
- Cite knowledge base sources when referenced

Never:
- Discriminate based on protected characteristics (age, gender, race, religion, etc.)
- Make hiring decisions autonomously — provide recommendations only
- Provide legal advice about employment law
- Disclose confidential employee information`;
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
   * Build a prompt for HR assistance
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

Please provide your HR analysis and recommendations.`;
  }
}

// Export singleton
const hrAgent = new HRAgent();
module.exports = hrAgent;
module.exports.HRAgent = HRAgent;