import apiClient, { tokenStorage } from './apiClient';

export const authService = {
  async login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    tokenStorage.setSession(data.data);
    return data.data;
  },

  async register(name, email, password) {
    const { data } = await apiClient.post('/auth/register', { name, email, password });
    tokenStorage.setSession(data.data);
    return data.data;
  },

  async getProfile() {
    const { data } = await apiClient.get('/auth/profile');
    return data.data;
  },

  async updateProfile(profileData) {
    const { data } = await apiClient.put('/auth/profile', profileData);
    tokenStorage.setUser(data.data);
    return data.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    }
    tokenStorage.clear();
  },

  isAuthenticated() {
    return !!tokenStorage.getAccess();
  },
};

export default authService;