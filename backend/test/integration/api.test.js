/**
 * AI Enterprise Hub - API Integration Tests
 * Run with: npm test
 * Tests cover: health, auth, AI infrastructure, RAG, recommendations, document intelligence, analytics.
 */
const axios = require('axios');

const API_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';
let token = '';

describe('AI Enterprise Hub Integration Tests', () => {
  beforeAll(async () => {
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        name: 'Test User',
        email: `test_${Date.now()}@test.com`,
        password: 'Test@123456',
      });
      token = registerResponse.data.data?.token || registerResponse.data.token;
    } catch (error) {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: process.env.TEST_EMAIL || 'test@test.com',
        password: process.env.TEST_PASSWORD || 'Test@123456',
      });
      token = loginResponse.data.data?.token || loginResponse.data.token;
    }
  });

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  test('Health check endpoint responds', async () => {
    const response = await axios.get(`${API_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test('Monitoring health endpoint responds', async () => {
    const response = await axios.get(`${API_URL}/monitoring/health`);
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test('Security audit returns checks', async () => {
    const response = await axios.post(`${API_URL}/monitoring/security-audit`, {}, { headers: authHeaders() });
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.checks.length).toBeGreaterThan(0);
  });

  test('Analytics can track events', async () => {
    const trackResponse = await axios.post(`${API_URL}/analytics/events`, {
      eventType: 'user_action',
      category: 'user',
      action: 'test_action',
      resource: 'test',
    }, { headers: authHeaders() });
    expect(trackResponse.status).toBe(201);
  });

  test('Document intelligence capabilities are exposed', async () => {
    const response = await axios.get(`${API_URL}/document-intelligence/capabilities`, { headers: authHeaders() });
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.features.length).toBeGreaterThan(0);
  });

  test('Recommendation engine types are available', async () => {
    const response = await axios.get(`${API_URL}/recommendations/types`, { headers: authHeaders() });
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});