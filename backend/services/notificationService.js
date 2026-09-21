const Notification = require('../models/Notification');

// Create notification
const createNotification = async ({ user, type, title, message, link, metadata }) => {
  try {
    const notification = await Notification.create({
      user, type, title, message, link, metadata,
    });
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error.message);
    return null;
  }
};

// Get user notifications
const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
  ]);
  return { notifications, total, unreadCount, page, pages: Math.ceil(total / limit) };
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true },
    { new: true }
  );
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
  return Notification.updateMany(
    { user: userId, read: false },
    { read: true }
  );
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
  return Notification.findOneAndDelete({ _id: notificationId, user: userId });
};

// Get unread count
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, read: false });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};