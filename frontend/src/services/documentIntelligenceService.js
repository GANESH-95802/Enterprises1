import apiClient from './apiClient';

export const documentIntelligenceService = {
  // Upload & analyze
  uploadAndAnalyze: (formData) =>
    apiClient.post('/document-intelligence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Analysis operations
  analyzeDocument: (analysisId, data) =>
    apiClient.post(`/document-intelligence/documents/${analysisId}/analyze`, data),
  extractInformation: (analysisId, data) =>
    apiClient.post(`/document-intelligence/documents/${analysisId}/extract`, data),
  summarizeDocument: (analysisId, data) =>
    apiClient.post(`/document-intelligence/documents/${analysisId}/summarize`, data),
  compareDocuments: (data) => apiClient.post('/document-intelligence/compare', data),
  findSimilarDocuments: (analysisId, params) =>
    apiClient.get(`/document-intelligence/documents/${analysisId}/similar`, { params }),

  // Document management
  getDocument: (analysisId) =>
    apiClient.get(`/document-intelligence/documents/${analysisId}`),
  listDocuments: (params) =>
    apiClient.get('/document-intelligence/documents', { params }),
  deleteDocument: (analysisId) =>
    apiClient.delete(`/document-intelligence/documents/${analysisId}`),

  // Engine info
  getStats: () => apiClient.get('/document-intelligence/stats'),
  getCapabilities: () => apiClient.get('/document-intelligence/capabilities'),
};

export default documentIntelligenceService;