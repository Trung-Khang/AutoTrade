import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('autotrade_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('autotrade_token')));

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('autotrade_token');
      setUser(null);
      setLoading(false);
      return;
    }
    localStorage.setItem('autotrade_token', token);
    apiClient.get('/auth/me')
      .then((currentUser) => setUser(currentUser))
      .catch(() => {
        localStorage.removeItem('autotrade_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    const response = await apiClient.post('/auth/login', { usernameOrEmail, password });
    const userData = { id: response.userId, username: response.username, fullName: response.fullName, email: response.email, role: response.role };
    setUser(userData);
    setToken(response.token);
    return { success: true, user: userData };
  };

  const register = (userData) => apiClient.post('/auth/register', userData, { timeout: 50000 });

  const logout = async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* Clear a local stateless session even if offline. */ }
    finally { localStorage.removeItem('autotrade_token'); setToken(null); setUser(null); }
  };

  return <AuthContext.Provider value={{
    user, token, loading, login, register, logout,
    isAuthenticated: Boolean(user), isCustomer: user?.role === 'CUSTOMER',
    isStaff: user?.role === 'STAFF', isAdmin: user?.role === 'ADMIN',
  }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
