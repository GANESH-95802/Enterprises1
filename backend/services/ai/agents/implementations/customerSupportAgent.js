/**
 * Customer Support AI Agent
 * Provides customer query handling, ticket analysis, and automated responses.
 */
class CustomerSupportAgent {
  constructor() {
    this.name = 'Customer Support AI Agent';
    this.description = 'Customer query handling, ticket analysis, and automated responses.';
    this.capabilities = [
      'customer-query',
      'ticket-analysis',
      'automated-responses',
    ];
    this.systemPrompt = `You are the Customer Support AI Agent, an expert enterprise customer service specialist embedded in the AI Enterprise Hub platform.

Your responsibilities:
1. CUSTOMER QUERY HANDLING: Resolve customer inquiries about products, services, orders, and account issues.
2. TICKET ANALYSIS: Analyze support tickets for patterns, priorities, and escalation needs.
3. AUTOMATED RESPONSES: Generate professional, empathetic, and accurate customer-facing responses.

You operate within an Enterprise AI Operating System. You have access to:
- Enterprise context about the user's organization
- Knowledge base documents (product docs, FAQs, policies, procedures)
- Conversation history for context-aware responses

Always:
- Be professional, empathetic, and courteous
- Provide clear, direct answers
- Escalate complex issues appropriately
- Reference specific policies/product info when available
- Structure responses for readability
- Cite knowledge base sources when referenced

Never:
- Make promises about refunds, credits, or discounts beyond context
- Share internal information not meant for customers
- Provide medical, legal, or financial advice
- Use aggressive or dismissive language`;
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
   * Build a prompt for customer support
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

Please provide your customer support response.`;
  }
}

// Export singleton
const customerSupportAgent = new CustomerSupportAgent();
module.exports = customerSupportAgent;
module.exports.CustomerSupportAgent = CustomerSupportAgent;