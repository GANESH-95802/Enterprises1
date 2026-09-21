/**
 * Assistant Profiles
 * Defines the four assistant profiles: Business, Education, Healthcare, General.
 * Each profile configures behavior, allowed tools, and defaults.
 */
const { getTemplate } = require('../templates');

const PROFILES = {
  business: {
    id: 'business',
    name: 'Business Assistant',
    description: 'Specialized in business analytics, operations, financial insights, and enterprise decision support.',
    allowedTools: ['get_enterprise_stats', 'get_user_info', 'generate_report', 'search_knowledge_base', 'get_knowledge_stats'],
    defaultProvider: 'auto',
    defaultModel: '',
    defaultTemperature: 0.5,
    defaultMaxTokens: 2000,
    templateId: 'business',
  },
  education: {
    id: 'education',
    name: 'Education Assistant',
    description: 'Specialized in learning, skill development, training, and certification guidance.',
    allowedTools: ['get_user_info', 'get_skills', 'get_certificates'],
    defaultProvider: 'auto',
    defaultModel: '',
    defaultTemperature: 0.6,
    defaultMaxTokens: 1800,
    templateId: 'education',
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare Assistant',
    description: 'Specialized in healthcare record analysis, medical explanation, and wellness guidance.',
    allowedTools: ['get_healthcare_records', 'get_user_info'],
    defaultProvider: 'auto',
    defaultModel: '',
    defaultTemperature: 0.4,
    defaultMaxTokens: 1500,
    templateId: 'healthcare',
  },
  general: {
    id: 'general',
    name: 'General Assistant',
    description: 'General-purpose AI assistant for everyday enterprise queries.',
    allowedTools: ['get_enterprise_stats', 'get_user_info', 'search_knowledge_base', 'get_knowledge_stats'],
    defaultProvider: 'auto',
    defaultModel: '',
    defaultTemperature: 0.7,
    defaultMaxTokens: 1500,
    templateId: 'general',
  },
};

const getProfile = (profileId) => PROFILES[profileId] || PROFILES.general;

const listProfiles = () => Object.values(PROFILES).map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  allowedTools: p.allowedTools,
  defaultTemperature: p.defaultTemperature,
  defaultMaxTokens: p.defaultMaxTokens,
}));

const isToolAllowed = (profileId, toolName) => {
  const profile = getProfile(profileId);
  return profile.allowedTools.includes(toolName);
};

const getProfileConfig = (profileId, overrides = {}) => {
  const profile = getProfile(profileId);
  const template = getTemplate(profile.templateId);
  return {
    ...profile,
    template,
    provider: overrides.provider || profile.defaultProvider,
    model: overrides.model || profile.defaultModel,
    temperature: overrides.temperature !== undefined ? overrides.temperature : profile.defaultTemperature,
    maxTokens: overrides.maxTokens || profile.defaultMaxTokens,
  };
};

module.exports = {
  PROFILES,
  getProfile,
  listProfiles,
  isToolAllowed,
  getProfileConfig,
};