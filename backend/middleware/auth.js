const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isBlacklisted } = require('../utils/tokenBlacklist');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Check if token has been blacklisted (logged out)
      if (isBlacklisted(token)) {
        return res.status(401).json({ message: 'Not authorized, token has been revoked' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ensure this is an access token, not a refresh token
      // Prevents token confusion attacks
      if (decoded.type && decoded.type !== 'access') {
        return res.status(401).json({ message: 'Not authorized, invalid token type' });
      }

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
      }
      console.error('Auth error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role '${req.user.role}' is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
