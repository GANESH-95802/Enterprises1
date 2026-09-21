import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    toast.error(message);
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: () => api.get('/dashboard/charts'),
};

export const crudAPI = (resource) => ({
  getAll: (params) => api.get(`/${resource}`, { params }),
  getById: (id) => api.get(`/${resource}/${id}`),
  create: (data) => api.post(`/${resource}`, data),
  update: (id, data) => api.put(`/${resource}/${id}`, data),
  delete: (id) => api.delete(`/${resource}/${id}`),
});

export const aiAPI = {
  predictSales: (data) => api.post('/ai/predict-sales', data),
  generateDocument: (data) => api.post('/ai/generate-document', data),
  explainMedical: (data) => api.post('/ai/explain-medical', data),
  analyzeImage: (data) => api.post('/ai/analyze-image', data),
  evaluateSkill: (data) => api.post('/ai/evaluate-skill', data),
  getRecommendations: (data) => api.post('/ai/recommendations', data),
};

export const chatbotAPI = {
  sendMessage: (data) => api.post('/chatbot/message', data),
  generateReport: (data) => api.post('/chatbot/generate-report', data),
  getInsights: () => api.get('/chatbot/insights'),
};

export const enterpriseAPI = {
  getActivities: (params) => api.get('/enterprise/activities', { params }),
  getRecentActivities: () => api.get('/enterprise/activities/recent'),
  getNotifications: (params) => api.get('/enterprise/notifications', { params }),
  getUnreadCount: () => api.get('/enterprise/notifications/unread-count'),
  markNotificationRead: (id) => api.put(`/enterprise/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/enterprise/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/enterprise/notifications/${id}`),
  getAnalytics: () => api.get('/enterprise/analytics'),
};

export default api;
