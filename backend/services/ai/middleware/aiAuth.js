const { protect } = require('../../../middleware/auth');

/**
 * AI Auth Middleware
 * Protects AI routes with authentication.
 * Uses the existing protect middleware to maintain consistency.
 */
const aiAuth = protect;

/**
 * Role-based authorization for AI endpoints
 * @param {...string} roles - Allowed roles
 */
const aiAuthorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this AI resource`,
      });
    }
    next();
  };
};

module.exports = { aiAuth, aiAuthorize };