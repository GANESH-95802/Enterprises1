/**
 * Prompt Template Registry
 * Central registry for all assistant profile prompt templates.
 * Templates are keyed by profile id and can be retrieved by profile.
 */
const GENERAL_TEMPLATE = require('./general.template');
const BUSINESS_TEMPLATE = require('./business.template');
const EDUCATION_TEMPLATE = require('./education.template');
const HEALTHCARE_TEMPLATE = require('./healthcare.template');

const TEMPLATES = {
  general: GENERAL_TEMPLATE,
  business: BUSINESS_TEMPLATE,
  education: EDUCATION_TEMPLATE,
  healthcare: HEALTHCARE_TEMPLATE,
};

/**
 * Get a template by profile type
 * @param {string} profile - Profile id (business, education, healthcare, general)
 * @returns {Object} - Template object
 */
const getTemplate = (profile) => {
  return TEMPLATES[profile] || GENERAL_TEMPLATE;
};

/**
 * List all available templates
 * @returns {Array<Object>} - List of template metadata
 */
const listTemplates = () => {
  return Object.values(TEMPLATES).map(({ id, name, description }) => ({
    id,
    name,
    description,
  }));
};

/**
 * Render a template with variables
 * @param {Object} template - Template object
 * @param {Object} variables - { context, history, query }
 * @returns {Object} - Rendered system and user prompts
 */
const renderTemplate = (template, variables = {}) => {
  const replacements = {
    context: variables.context || 'No additional context available.',
    history: variables.history || 'No prior conversation.',
    query: variables.query || '',
  };

  let systemPrompt = template.systemPrompt;
  let userPrompt = template.userPrompt;

  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    systemPrompt = systemPrompt.replace(pattern, value);
    userPrompt = userPrompt.replace(pattern, value);
  }

  return {
    system: systemPrompt,
    user: userPrompt,
    temperature: variables.temperature || template.temperature,
    maxTokens: variables.maxTokens || template.maxTokens,
  };
};

module.exports = {
  TEMPLATES,
  getTemplate,
  listTemplates,
  renderTemplate,
};