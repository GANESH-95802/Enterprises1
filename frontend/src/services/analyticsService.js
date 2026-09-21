import apiClient from './apiClient';

export const analyticsService = {
  // Event tracking
  trackEvent: (data) => apiClient.post('/analytics/events', data),
  trackEvents: (data) => apiClient.post('/analytics/events/batch', data),

  // User behavior
  getUserBehavior: (userId, params) =>
    apiClient.get(`/analytics/users/${userId}/behavior`, { params }),
  predictUserEngagement: (userId, params) =>
    apiClient.get(`/analytics/users/${userId}/predict`, { params }),

  // AI analytics
  getAIUsage: (params) => apiClient.get('/analytics/ai/usage', { params }),
  getAIPerformance: (params) => apiClient.get('/analytics/ai/performance', { params }),
  getRecommendationAnalytics: (params) =>
    apiClient.get('/analytics/recommendations', { params }),
  getConversationInsights: (params) =>
    apiClient.get('/analytics/conversations', { params }),

  // Insights & predictions
  getTrends: (params) => apiClient.get('/analytics/trends', { params }),
  generateInsights: (params) => apiClient.get('/analytics/insights', { params }),
  getPredictions: (params) => apiClient.get('/analytics/predictions', { params }),

  // ML service layer
  extractFeatures: (params) => apiClient.get('/analytics/ml/features', { params }),
  buildFeatureVectors: (params) =>
    apiClient.get('/analytics/ml/feature-vectors', { params }),

  // Aggregation & system
  runAggregation: (data) => apiClient.post('/analytics/aggregate', data),
  getStats: () => apiClient.get('/analytics/stats'),
  getCapabilities: () => apiClient.get('/analytics/capabilities'),
};

export default analyticsService;