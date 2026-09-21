import { useState, useEffect } from 'react';
import { enterpriseService } from '../services';
import { PageHeader, Card, Loading, Badge } from '../components/ui';
import { FiBell, FiCheck, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await enterpriseService.getNotifications({ limit: 50 });
      const data = res.data?.notifications || res.data?.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await enterpriseService.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      toast.success('Marked as read');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await enterpriseService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await enterpriseService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <Loading text="Loading notifications..." />;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with your enterprise activity"
        actions={
          <button className="btn btn-outline" onClick={markAllRead}>
            <FiCheckCircle /> Mark All Read
          </button>
        }
      />

      <Card>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <FiBell className="empty-state-icon" />
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((n) => (
              <div key={n._id} className={`notification-item ${n.read ? '' : 'unread'}`}>
                <div className="notification-icon">
                  <FiBell />
                </div>
                <div className="notification-content">
                  <strong>{n.title || n.message || 'Notification'}</strong>
                  {n.message && n.title && <p>{n.message}</p>}
                  <small>{new Date(n.createdAt).toLocaleString()}</small>
                </div>
                <div className="notification-actions">
                  {!n.read && (
                    <button className="btn btn-sm btn-outline" onClick={() => markRead(n._id)} aria-label="Mark as read">
                      <FiCheck />
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => deleteNotification(n._id)} aria-label="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}