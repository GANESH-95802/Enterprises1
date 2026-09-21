import apiClient from './apiClient';

export const assistantService = {
  // Chat
  chat: (data) => apiClient.post('/assistant/chat', data),
  chatWithTools: (data) => apiClient.post('/assistant/chat/tools', data),
  streamChat: (data) => apiClient.post('/assistant/chat/stream', data),

  // Discovery
  getProfiles: () => apiClient.get('/assistant/profiles'),
  getTemplates: () => apiClient.get('/assistant/templates'),
  getTools: () => apiClient.get('/assistant/tools'),
  getStats: () => apiClient.get('/assistant/stats'),

  // Sessions
  listSessions: (params) => apiClient.get('/assistant/sessions', { params }),
  getSession: (sessionId) => apiClient.get(`/assistant/sessions/${sessionId}`),
  updateSession: (sessionId, data) => apiClient.patch(`/assistant/sessions/${sessionId}`, data),
  archiveSession: (sessionId) => apiClient.delete(`/assistant/sessions/${sessionId}`),
  deleteSession: (sessionId) => apiClient.delete(`/assistant/sessions/${sessionId}/permanent`),
};

export const aiInfraService = {
  processQuery: (data) => apiClient.post('/ai/query', data),
  getHistory: (params) => apiClient.get('/ai/history', { params }),
  getContext: () => apiClient.get('/ai/context'),
  submitFeedback: (data) => apiClient.post('/ai/feedback', data),
  clearHistory: () => apiClient.delete('/ai/history'),

  // Legacy AI endpoints
  predictSales: (data) => apiClient.post('/ai/predict-sales', data),
  generateDocument: (data) => apiClient.post('/ai/generate-document', data),
  explainMedical: (data) => apiClient.post('/ai/explain-medical', data),
  analyzeImage: (data) => apiClient.post('/ai/analyze-image', data),
  evaluateSkill: (data) => apiClient.post('/ai/evaluate-skill', data),
  getRecommendations: (data) => apiClient.post('/ai/recommendations', data),
};

export const chatbotService = {
  sendMessage: (data) => apiClient.post('/chatbot/message', data),
  generateReport: (data) => apiClient.post('/chatbot/generate-report', data),
  getInsights: () => apiClient.get('/chatbot/insights'),
};

export default assistantService;