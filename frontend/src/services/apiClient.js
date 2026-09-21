import axios from 'axios';

const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Token helpers ───────────────────────────────────────────────────────
const TOKEN_KEY = 'ai_hub_token';
const REFRESH_KEY = 'ai_hub_refresh';
const USER_KEY = 'ai_hub_user';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },
  setTokens: (access, refresh) => {
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  setSession: ({ token, refreshToken, ...user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user && Object.keys(user).length > 0) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ─── Request interceptor: attach Bearer token ────────────────────────────
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
  pendingQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  pendingQueue = [];
};

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor: handle 401 with token refresh ─────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Public endpoints that should not trigger refresh
    if (status !== 401 || originalRequest?._retry || originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register')) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken) {
      tokenStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }).catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const newAccess = data.data?.token;
      const newRefresh = data.data?.refreshToken || refreshToken;
      tokenStorage.setTokens(newAccess, newRefresh);
      processQueue(null, newAccess);
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;