const Activity = require('../../../models/Activity');

/**
 * Audit Logger Middleware
 * Logs AI requests and responses for audit and compliance purposes.
 */
const auditLogger = async (req, res, next) => {
  const startTime = Date.now();

  // Capture the response
  const originalJson = res.json;
  res.json = function (body) {
    res.locals.responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;

      await Activity.create({
        user: req.user?._id || null,
        action: 'create',
        resource: 'ai-query',
        resourceId: null,
        details: JSON.stringify({
          method: req.method,
          path: req.originalUrl,
          queryType: req.body?.type || req.body?.message ? 'chat' : 'query',
          provider: res.locals.responseBody?.data?.provider || 'unknown',
          model: res.locals.responseBody?.data?.model || 'unknown',
          durationMs: duration,
          statusCode: res.statusCode,
          success: res.statusCode < 400,
          tokensUsed: res.locals.responseBody?.data?.usage?.total_tokens
            || res.locals.responseBody?.data?.usage?.totalTokens
            || 0,
        }),
        ip: req.ip || '',
        userAgent: req.get('User-Agent') || '',
      });
    } catch (error) {
      console.error('Audit logger error:', error.message);
    }
  });

  next();
};

module.exports = auditLogger;