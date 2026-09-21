const express = require('express');
const router = express.Router();
const {
  getActivities,
  getRecentActivities,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
  deleteNotification,
  getAnalytics,
} = require('../controllers/enterpriseController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Activity routes
router.get('/activities', getActivities);
router.get('/activities/recent', authorize('admin', 'manager'), getRecentActivities);

// Notification routes
router.get('/notifications', getNotifications);
router.get('/notifications/unread-count', getUnreadCount);
router.put('/notifications/read-all', markAllNotificationsRead);
router.put('/notifications/:id/read', markNotificationRead);
router.delete('/notifications/:id', deleteNotification);

// Analytics
router.get('/analytics', authorize('admin', 'manager'), getAnalytics);

module.exports = router;