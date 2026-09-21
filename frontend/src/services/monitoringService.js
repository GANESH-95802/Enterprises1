import apiClient from './apiClient';

export const monitoringService = {
  getHealth: () => apiClient.get('/monitoring/health'),
  getPerformance: () => apiClient.get('/monitoring/performance'),
  getSecurityAudit: () => apiClient.get('/monitoring/security-audit'),
  runSecurityAudit: () => apiClient.post('/monitoring/security-audit'),
  getErrorStats: () => apiClient.get('/monitoring/errors'),
};

export default monitoringService;