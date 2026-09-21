const contextManager = require('../orchestrator/contextManager');

/**
 * Cache Check Middleware
 * Checks if a cached AI response exists for the request.
 * If cached, returns the cached response directly.
 */
const cacheCheck = async (req, res, next) => {
  // Only cache GET requests and POST /query requests
  if (req.method !== 'GET' && !(req.method === 'POST' && req.path === '/query')) {
    return next();
  }

  try {
    const query = req.method === 'GET'
      ? req.query.q
      : req.body?.query;

    if (!query || !req.user) {
      return next();
    }

    const cacheResult = await contextManager.loadCachedContext(query, req.user._id);

    if (cacheResult.hit) {
      // Return cached response
      return res.json({
        success: true,
        cached: true,
        data: {
          ...cacheResult.data,
          message: cacheResult.data?.text || cacheResult.data?.message || '',
          provider: cacheResult.data?.provider || 'cache',
          model: cacheResult.data?.model || 'cached',
          timestamp: new Date().toISOString(),
          cacheKey: cacheResult.key,
        },
      });
    }

    // Attach cache key to request for later caching
    req.cacheKey = cacheResult.key;
    next();
  } catch (error) {
    console.error('Cache check error:', error.message);
    next();
  }
};

module.exports = cacheCheck;