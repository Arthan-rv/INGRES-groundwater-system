import { createContext, useContext, useMemo, useState } from 'react';
import { logout as logoutRequest } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('ingres_user');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Failed to parse cached user data:', error);
      localStorage.removeItem('ingres_user');
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('ingres_token'));
  const [isLoading, setIsLoading] = useState(false);

  const login = (payload) => {
    setUser(payload.user);
    setToken(payload.user.token);
    localStorage.setItem('ingres_user', JSON.stringify(payload.user));
    localStorage.setItem('ingres_token', payload.user.token);
  };

  const logout = async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      setIsLoading(true);
      await logoutRequest(token);
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      setIsLoading(false);
      setUser(null);
      setToken(null);
      localStorage.removeItem('ingres_user');
      localStorage.removeItem('ingres_token');
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isLoading,
      isAuthenticated: Boolean(token)
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

