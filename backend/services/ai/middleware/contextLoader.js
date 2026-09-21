const contextManager = require('../orchestrator/contextManager');

/**
 * Context Loader Middleware
 * Loads and attaches AI context to the request for downstream handlers.
 */
const contextLoader = async (req, res, next) => {
  try {
    if (req.user) {
      const context = await contextManager.buildQueryContext(req.user._id, {
        type: req.path.includes('chat') ? 'chat' : 'general',
      });
      req.aiContext = context;
      req.aiContextText = contextManager.contextToPrompt(context);
    }
    next();
  } catch (error) {
    console.error('Context loader error:', error.message);
    req.aiContext = {};
    req.aiContextText = '';
    next();
  }
};

module.exports = contextLoader;