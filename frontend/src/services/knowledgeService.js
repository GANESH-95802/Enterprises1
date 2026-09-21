import apiClient from './apiClient';

export const knowledgeService = {
  // Document ingestion
  uploadDocument: (formData) =>
    apiClient.post('/knowledge/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Semantic search & retrieval
  search: (data) => apiClient.post('/knowledge/search', data),
  retrieve: (data) => apiClient.post('/knowledge/retrieve', data),

  // Document management
  listDocuments: (params) => apiClient.get('/knowledge/documents', { params }),
  getDocument: (documentId) => apiClient.get(`/knowledge/documents/${documentId}`),
  getDocumentChunks: (documentId, params) =>
    apiClient.get(`/knowledge/documents/${documentId}/chunks`, { params }),
  updateDocument: (documentId, data) =>
    apiClient.patch(`/knowledge/documents/${documentId}`, data),
  deleteDocument: (documentId) =>
    apiClient.delete(`/knowledge/documents/${documentId}`),

  // Stats
  getStats: () => apiClient.get('/knowledge/stats'),
};

export default knowledgeService;