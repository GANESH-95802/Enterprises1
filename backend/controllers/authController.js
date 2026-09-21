const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/helpers');
const { addToBlacklist } = require('../utils/tokenBlacklist');
const { logActivity } = require('../services/activityService');

// @desc    Register user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
    });

    // Audit log: user registration
    await logActivity({
      user: user._id,
      action: 'create',
      resource: 'user',
      resourceId: user._id,
      details: `New user registered: ${email}`,
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      // Audit log: failed login (user not found)
      await logActivity({
        user: null,
        action: 'login',
        resource: 'auth',
        details: `Failed login attempt for email: ${email} (user not found)`,
        req,
      });
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Audit log: failed login (wrong password)
      await logActivity({
        user: user._id,
        action: 'login',
        resource: 'auth',
        details: `Failed login attempt for email: ${email} (invalid password)`,
        req,
      });
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Audit log: successful login
    await logActivity({
      user: user._id,
      action: 'login',
      resource: 'auth',
      details: `User logged in: ${email}`,
      req,
    });

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.department,
        token: generateToken(user._id),
        refreshToken: generateRefreshToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('Refresh token is required');
    }

    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure this is a refresh token, not an access token
    if (decoded.type && decoded.type !== 'refresh') {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    // Check if refresh token is blacklisted
    const { isBlacklisted } = require('../utils/tokenBlacklist');
    if (isBlacklisted(token)) {
      res.status(401);
      throw new Error('Refresh token has been revoked');
    }

    // Get user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    if (!user.isActive) {
      res.status(401);
      throw new Error('Account is deactivated');
    }

    // Issue new access token + rotate refresh token
    const newAccessToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Blacklist the old refresh token (rotation)
    addToBlacklist(token);

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      return next(new Error('Refresh token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401);
      return next(new Error('Invalid refresh token'));
    }
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Blacklist the access token
      addToBlacklist(token);
    }

    // Audit log: logout
    await logActivity({
      user: req.user._id,
      action: 'logout',
      resource: 'auth',
      details: `User logged out: ${req.user.email}`,
      req,
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, department, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.department = department || user.department;
      user.avatar = avatar || user.avatar;

      const updatedUser = await user.save();

      // Audit log: profile update
      await logActivity({
        user: user._id,
        action: 'update',
        resource: 'user',
        resourceId: user._id,
        details: `User profile updated: ${user.email}`,
        req,
      });

      res.json({
        success: true,
        data: updatedUser,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getProfile, updateProfile };