import apiClient from './apiClient';

export const enterpriseService = {
  // Activities
  getActivities: (params) => apiClient.get('/enterprise/activities', { params }),
  getRecentActivities: () => apiClient.get('/enterprise/activities/recent'),

  // Notifications
  getNotifications: (params) => apiClient.get('/enterprise/notifications', { params }),
  getUnreadCount: () => apiClient.get('/enterprise/notifications/unread-count'),
  markNotificationRead: (id) => apiClient.put(`/enterprise/notifications/${id}/read`),
  markAllNotificationsRead: () => apiClient.put('/enterprise/notifications/read-all'),
  deleteNotification: (id) => apiClient.delete(`/enterprise/notifications/${id}`),

  // Analytics
  getAnalytics: () => apiClient.get('/enterprise/analytics'),
};

export const dashboardService = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getCharts: (params) => apiClient.get('/dashboard/charts', { params }),
};

export const reportService = {
  getAll: (params) => apiClient.get('/reports', { params }),
  getById: (id) => apiClient.get(`/reports/${id}`),
  create: (data) => apiClient.post('/reports', data),
  update: (id, data) => apiClient.put(`/reports/${id}`, data),
  delete: (id) => apiClient.delete(`/reports/${id}`),
};

export const crudService = (resource) => ({
  getAll: (params) => apiClient.get(`/${resource}`, { params }),
  getById: (id) => apiClient.get(`/${resource}/${id}`),
  create: (data) => apiClient.post(`/${resource}`, data),
  update: (id, data) => apiClient.put(`/${resource}/${id}`, data),
  delete: (id) => apiClient.delete(`/${resource}/${id}`),
});

export default enterpriseService;