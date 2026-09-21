import apiClient from './apiClient';

export const saasService = {
  // Plans & Pricing
  getPlans: () => apiClient.get('/saas/plans'),

  // Organization Management
  registerOrganization: (data) => apiClient.post('/saas/organizations/register', data),
  getMyOrganizations: () => apiClient.get('/saas/organizations'),
  getOrganization: (orgId) => apiClient.get(`/saas/organizations/${orgId}`),
  updateOrganization: (orgId, data) => apiClient.patch(`/saas/organizations/${orgId}`, data),

  // Team Management
  getTeam: (orgId) => apiClient.get(`/saas/organizations/${orgId}/team`),
  inviteMember: (orgId, data) => apiClient.post(`/saas/organizations/${orgId}/team/invite`, data),
  updateMember: (orgId, memberId, data) => apiClient.patch(`/saas/organizations/${orgId}/team/${memberId}`, data),
  removeMember: (orgId, memberId) => apiClient.delete(`/saas/organizations/${orgId}/team/${memberId}`),

  // Subscription & Billing
  getSubscription: (orgId) => apiClient.get(`/saas/organizations/${orgId}/subscription`),
  changePlan: (orgId, data) => apiClient.post(`/saas/organizations/${orgId}/subscription/change`, data),
  cancelSubscription: (orgId) => apiClient.post(`/saas/organizations/${orgId}/subscription/cancel`),
  listInvoices: (orgId, params) => apiClient.get(`/saas/organizations/${orgId}/invoices`, { params }),

  // Usage Tracking
  getUsage: (orgId) => apiClient.get(`/saas/organizations/${orgId}/usage`),
  getUsageHistory: (orgId, params) => apiClient.get(`/saas/organizations/${orgId}/usage/history`, { params }),

  // Admin
  getPlatformUsage: (params) => apiClient.get('/saas/admin/platform-usage', { params }),
};

export default saasService;