import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../API/axios';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for cleanup
  const refreshTimeoutRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const refreshPromiseRef = useRef(null);

  // Activity tracking
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  // Token refresh mechanism
  const refreshToken = useCallback(async () => {
    if (isRefreshing && refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      setIsRefreshing(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await axiosInstance.post('/auth/refresh', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const { token: newToken, user: updatedUser, expiresIn } = response.data;

        localStorage.setItem('token', newToken);
        setUser(updatedUser);
        setSessionExpiry(Date.now() + (expiresIn * 1000));

        // Schedule next refresh
        scheduleTokenRefresh(expiresIn * 1000);

        return { success: true };
      } catch (error) {
        console.error('Token refresh failed:', error);
        handleLogout();
        return { success: false, error: 'Session expired' };
      } finally {
        setIsRefreshing(false);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [isRefreshing]);

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((delay) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refreshToken();
    }, Math.max(delay - 60000, 0)); // Refresh 1 minute before expiry
  }, [refreshToken]);

  // Session timeout handler
  const handleSessionTimeout = useCallback(() => {
    handleLogout();
    alert('Your session has expired due to inactivity. Please log in again.');
  }, []);

  // Schedule activity timeout
  const scheduleActivityTimeout = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // 30 minutes of inactivity timeout
    activityTimeoutRef.current = setTimeout(() => {
      handleSessionTimeout();
    }, 30 * 60 * 1000);
  }, [handleSessionTimeout]);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setSessionExpiry(null);

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  }, []);

  // Login with OAuth tokens
  const loginWithTokens = useCallback(async (token, refreshToken, userData) => {
    try {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      setUser(userData);
      setSessionExpiry(Date.now() + (15 * 60 * 1000)); // 15 minutes default

      // Schedule activity timeout
      scheduleActivityTimeout();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'OAuth login failed'
      };
    }
  }, [scheduleActivityTimeout]);

  // Enhanced login with remember me
  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
        rememberMe
      });

      const { token, refreshToken, user, expiresIn } = response.data;

      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      setUser(user);
      setSessionExpiry(Date.now() + (expiresIn * 1000));

      // Schedule token refresh and activity timeout
      scheduleTokenRefresh(expiresIn * 1000);
      scheduleActivityTimeout();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Enhanced register
  const register = async (username, email, password) => {
    try {
      const response = await axiosInstance.post('/auth/register', {
        username,
        email,
        password
      });
      const { token, user, expiresIn } = response.data;

      localStorage.setItem('token', token);
      setUser(user);
      setSessionExpiry(Date.now() + (expiresIn * 1000));

      scheduleTokenRefresh(expiresIn * 1000);
      scheduleActivityTimeout();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Enhanced logout
  const logout = useCallback(() => {
    handleLogout();
  }, [handleLogout]);

  // Manual token refresh
  const manualRefresh = useCallback(() => {
    return refreshToken();
  }, [refreshToken]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission) => {
    return user?.permissions?.includes(permission) || false;
  }, [user]);

  // Initialize app
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axiosInstance.get('/auth/verify', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          const { user: verifiedUser, expiresIn } = response.data;
          setUser(verifiedUser);
          setSessionExpiry(Date.now() + (expiresIn * 1000));

          // Schedule refresh and activity timeout
          scheduleTokenRefresh(expiresIn * 1000);
          scheduleActivityTimeout();
        } catch (error) {
          console.error('Token verification failed:', error);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [scheduleTokenRefresh, scheduleActivityTimeout, handleLogout]);

  // Activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const handleActivity = () => {
      updateActivity();
      scheduleActivityTimeout();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity, scheduleActivityTimeout]);

  const value = {
    user,
    login,
    loginWithTokens,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    sessionExpiry,
    lastActivity,
    isRefreshing,
    refreshToken: manualRefresh,
    hasRole,
    hasPermission,
    updateActivity
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;