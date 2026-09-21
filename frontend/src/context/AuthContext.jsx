import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, tokenStorage } from '../services';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Role hierarchy for access control
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
};

export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.USER]: 1,
};

export const hasRole = (user, requiredRole) => {
  if (!user?.role) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = tokenStorage.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const userData = await authService.register(name, email, password);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const updated = await authService.updateProfile(profileData);
    setUser(updated);
    return updated;
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      tokenStorage.setUser(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  const can = useCallback((requiredRole) => hasRole(user, requiredRole), [user]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
    can,
    isAdmin: user?.role === ROLES.ADMIN,
    isManager: user?.role === ROLES.MANAGER || user?.role === ROLES.ADMIN,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;