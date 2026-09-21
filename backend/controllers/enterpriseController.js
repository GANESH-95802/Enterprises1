const activityService = require('../services/activityService');
const notificationService = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

// @desc    Get user activity log
// @route   GET /api/enterprise/activities
const getActivities = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await activityService.getUserActivities(req.user._id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activities (admin)
// @route   GET /api/enterprise/activities/recent
const getRecentActivities = async (req, res, next) => {
  try {
    const activities = await activityService.getRecentActivities(20);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user notifications
// @route   GET /api/enterprise/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/enterprise/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/enterprise/notifications/read-all
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/enterprise/notifications/unread-count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete notification
// @route   DELETE /api/enterprise/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.deleteNotification(req.params.id, req.user._id);
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard analytics
// @route   GET /api/enterprise/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const Business = require('../models/Business');
    const Product = require('../models/Product');
    const Activity = require('../models/Activity');

    const [
      totalUsers,
      totalBusinesses,
      totalProducts,
      activeUsers,
      recentActivities,
      activitiesByDay,
    ] = await Promise.all([
      User.countDocuments(),
      Business.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ isActive: true }),
      Activity.find().sort('-createdAt').limit(10).populate('user', 'name email'),
      Activity.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totals: { users: totalUsers, businesses: totalBusinesses, products: totalProducts, activeUsers },
        recentActivities,
        activityTrend: activitiesByDay.reverse(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  getRecentActivities,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  deleteNotification,
  getAnalytics,
};