import apiClient from './apiClient';

export const recommendationService = {
  getRecommendations: (params) => apiClient.get('/recommendations', { params }),
  getPersonalized: (params) => apiClient.get('/recommendations/personalized', { params }),
  submitFeedback: (data) => apiClient.post('/recommendations/feedback', data),
  getHistory: (params) => apiClient.get('/recommendations/history', { params }),
  getStats: () => apiClient.get('/recommendations/stats'),
  findSimilar: (data) => apiClient.post('/recommendations/similar', data),
  getTypes: () => apiClient.get('/recommendations/types'),
  getEngineStats: () => apiClient.get('/recommendations/engine-stats'),
};

export default recommendationService;