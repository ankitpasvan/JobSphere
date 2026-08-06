import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        // Fetch fresh user data from backend to ensure profile data is up-to-date
        fetchFreshUserData(storedToken);
      } catch (e) {
        // Corrupted data — clear it out
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else if (!storedUser || storedUser === 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchFreshUserData = async (authToken) => {
    try {
      const response = await authAPI.getMe();
      if (response.data.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Failed to fetch fresh user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Register error:', error);
      // Surface the first validation error if available
      const errData = error.response?.data;
      const message = errData?.message ||
        (errData?.errors?.[0]?.msg) ||
        'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
    isCandidate: user?.role === 'candidate',
    isRecruiter: user?.role === 'recruiter',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

