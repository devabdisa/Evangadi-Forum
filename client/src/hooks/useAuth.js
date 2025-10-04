import { useCallback, useEffect, useState } from 'react';
import { useUser } from '../context/UserProvider';
import {
  isAuthenticated as checkAuth,
  getToken,
  clearTokens,
  hasRole,
  hasPermission,
  hasAnyRole,
  hasAnyPermission,
  isValidEmail,
  validatePassword,
  formatUserDisplayName,
  getUserInitials,
  canEditContent,
  canDeleteContent
} from '../utils/auth';

/**
 * Custom hook for authentication functionality
 */
export const useAuth = () => {
  const userContext = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const {
    user,
    login: contextLogin,
    register: contextRegister,
    logout: contextLogout,
    loading,
    isAuthenticated,
    sessionExpiry,
    lastActivity,
    isRefreshing,
    refreshToken,
    hasRole: contextHasRole,
    hasPermission: contextHasPermission,
    updateActivity
  } = userContext;

  // Enhanced login with validation
  const login = useCallback(async (email, password, rememberMe = false) => {
    setIsLoading(true);

    try {
      // Validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const result = await contextLogin(email, password, rememberMe);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, [contextLogin]);

  // Login with OAuth tokens (for social login)
  const loginWithTokens = useCallback(async (token, refreshToken, userData) => {
    setIsLoading(true);

    try {
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user context
      userContext.setUser(userData);

      return {
        success: true,
        user: userData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'OAuth login failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, [userContext]);

  // Enhanced register with validation
  const register = useCallback(async (username, email, password, confirmPassword) => {
    setIsLoading(true);

    try {
      // Validation
      if (!username || !email || !password || !confirmPassword) {
        throw new Error('All fields are required');
      }

      if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      const result = await contextRegister(username, email, password);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, [contextRegister]);

  // Enhanced logout
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await contextLogout();
      clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [contextLogout]);

  // Check if session is about to expire (within 5 minutes)
  const isSessionExpiringSoon = useCallback(() => {
    if (!sessionExpiry) return false;
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return sessionExpiry < fiveMinutesFromNow;
  }, [sessionExpiry]);

  // Get time until session expiry
  const getTimeUntilExpiry = useCallback(() => {
    if (!sessionExpiry) return null;
    const remaining = sessionExpiry - Date.now();
    return remaining > 0 ? remaining : 0;
  }, [sessionExpiry]);

  // Format time remaining in readable format
  const getFormattedTimeUntilExpiry = useCallback(() => {
    const remaining = getTimeUntilExpiry();
    if (!remaining) return 'Expired';

    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }, [getTimeUntilExpiry]);

  // Check if user has been inactive for too long
  const getInactivityTime = useCallback(() => {
    if (!lastActivity) return 0;
    return Date.now() - lastActivity;
  }, [lastActivity]);

  // Format inactivity time
  const getFormattedInactivityTime = useCallback(() => {
    const inactive = getInactivityTime();
    const minutes = Math.floor(inactive / (1000 * 60));

    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  }, [getInactivityTime]);

  // Role and permission checks
  const checkRole = useCallback((role) => {
    return contextHasRole(role);
  }, [contextHasRole]);

  const checkPermission = useCallback((permission) => {
    return contextHasPermission(permission);
  }, [contextHasPermission]);

  const checkAnyRole = useCallback((roles) => {
    return hasAnyRole(roles);
  }, []);

  const checkAnyPermission = useCallback((permissions) => {
    return hasAnyPermission(permissions);
  }, []);

  // Content editing permissions
  const canEdit = useCallback((contentUserId) => {
    return canEditContent(contentUserId, user);
  }, [user]);

  const canDelete = useCallback((contentUserId) => {
    return canDeleteContent(contentUserId, user);
  }, [user]);

  // User display helpers
  const getDisplayName = useCallback(() => {
    return formatUserDisplayName(user);
  }, [user]);

  const getInitials = useCallback(() => {
    return getUserInitials(user);
  }, [user]);

  // Activity tracking
  const trackActivity = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  // Manual token refresh
  const manualRefresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await refreshToken();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Token refresh failed'
      };
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  // Auto-refresh if session is expiring soon
  useEffect(() => {
    if (isSessionExpiringSoon() && isAuthenticated && !isRefreshing) {
      manualRefresh();
    }
  }, [isSessionExpiringSoon, isAuthenticated, isRefreshing, manualRefresh]);

  return {
    // User state
    user,
    isAuthenticated,
    loading: loading || isLoading,
    isRefreshing,

    // Session info
    sessionExpiry,
    lastActivity,
    isSessionExpiringSoon: isSessionExpiringSoon(),
    timeUntilExpiry: getTimeUntilExpiry(),
    formattedTimeUntilExpiry: getFormattedTimeUntilExpiry(),
    inactivityTime: getInactivityTime(),
    formattedInactivityTime: getFormattedInactivityTime(),

    // Authentication actions
    login,
    loginWithTokens,
    register,
    logout,
    refreshToken: manualRefresh,
    trackActivity,

    // Permission checks
    hasRole: checkRole,
    hasPermission: checkPermission,
    hasAnyRole: checkAnyRole,
    hasAnyPermission: checkAnyPermission,

    // Content permissions
    canEdit,
    canDelete,

    // User display helpers
    getDisplayName,
    getInitials,

    // Validation helpers
    isValidEmail,
    validatePassword,

    // Utility functions
    getToken: () => getToken(),
    isTokenExpired: () => {
      const token = getToken();
      return !token || isTokenExpired(token);
    }
  };
};

export default useAuth;