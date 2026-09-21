/**
 * Tools Index
 * Registers all available enterprise tools with the ToolRegistry.
 */
const toolRegistry = require('./registry');
const {
  getEnterpriseStats,
  getUserInfo,
  getSkills,
  getCertificates,
  getHealthcareRecords,
  generateReport,
} = require('./enterpriseTools');
const {
  searchKnowledgeBase,
  getKnowledgeStats,
} = require('./knowledgeTools');

// Register all enterprise tools
toolRegistry
  .register(getEnterpriseStats)
  .register(getUserInfo)
  .register(getSkills)
  .register(getCertificates)
  .register(getHealthcareRecords)
  .register(generateReport)
  .register(searchKnowledgeBase)
  .register(getKnowledgeStats);

module.exports = toolRegistry;
module.exports.ToolRegistry = require('./registry').ToolRegistry;