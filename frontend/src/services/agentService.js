import apiClient from './apiClient';

export const agentService = {
  // Agent discovery
  listAgents: (params) => apiClient.get('/agents', { params }),
  getAgent: (agentId) => apiClient.get(`/agents/${agentId}`),
  getAgentTypes: () => apiClient.get('/agents/types'),
  getStats: () => apiClient.get('/agents/stats'),

  // Agent management
  seedAgents: () => apiClient.post('/agents/seed'),
  createAgent: (data) => apiClient.post('/agents/create', data),
  updateAgent: (agentId, data) => apiClient.patch(`/agents/${agentId}`, data),
  deleteAgent: (agentId) => apiClient.delete(`/agents/${agentId}`),

  // Agent execution
  runAgent: (agentId, data) => apiClient.post(`/agents/${agentId}/run`, data),

  // Conversations
  listConversations: (params) => apiClient.get('/agents/conversations', { params }),
  getConversation: (conversationId) => apiClient.get(`/agents/conversations/${conversationId}`),
  archiveConversation: (conversationId) => apiClient.delete(`/agents/conversations/${conversationId}`),
  deleteConversation: (conversationId) => apiClient.delete(`/agents/conversations/${conversationId}/permanent`),
};

export default agentService;