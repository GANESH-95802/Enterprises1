const Activity = require('../models/Activity');

// Log user activity
const logActivity = async ({ user, action, resource, resourceId, details, req }) => {
  try {
    await Activity.create({
      user,
      action,
      resource,
      resourceId,
      details,
      ip: req?.ip || req?.connection?.remoteAddress || '',
      userAgent: req?.headers?.['user-agent'] || '',
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

// Get user activities
const getUserActivities = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [activities, total] = await Promise.all([
    Activity.find({ user: userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar'),
    Activity.countDocuments({ user: userId }),
  ]);
  return { activities, total, page, pages: Math.ceil(total / limit) };
};

// Get recent activities
const getRecentActivities = async (limit = 10) => {
  return Activity.find()
    .sort('-createdAt')
    .limit(limit)
    .populate('user', 'name email avatar');
};

// Get activities by resource
const getResourceActivities = async (resource, resourceId, limit = 10) => {
  return Activity.find({ resource, resourceId })
    .sort('-createdAt')
    .limit(limit)
    .populate('user', 'name email avatar');
};

module.exports = {
  logActivity,
  getUserActivities,
  getRecentActivities,
  getResourceActivities,
};