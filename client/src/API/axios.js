import axios from "axios";
import rateLimiter from "../security/rateLimiter";
import csrfProtection from "../security/csrfProtection";
import sessionManager from "../security/sessionManager";

// Create axios instance with enhanced configuration
const axiosInstance = axios.create({
  baseURL: "http://localhost:5500/api",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor with advanced security
axiosInstance.interceptors.request.use(
  (config) => {
    // Check rate limiting
    const rateLimitCheck = rateLimiter.checkRateLimit(
      config.url,
      sessionManager.currentSession?.userId,
      'client-side' // IP would be provided by backend in production
    );

    if (!rateLimitCheck.allowed) {
      const error = new Error(rateLimitCheck.reason);
      error.status = 429;
      error.retryAfter = rateLimitCheck.retryAfter;
      throw error;
    }

    // Add auth token to requests if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    if (csrfProtection.requiresCSRFProtection(config.method)) {
      const csrfToken = csrfProtection.getToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Add device fingerprint for tracking
    if (sessionManager.deviceFingerprint) {
      config.headers['X-Device-Fingerprint'] = sessionManager.deviceFingerprint;
    }

    // Add session ID if available
    if (sessionManager.currentSession) {
      config.headers['X-Session-ID'] = sessionManager.currentSession.id;
    }

    // Add request timestamp for debugging and monitoring
    config.metadata = {
      startTime: new Date(),
      endpoint: config.url,
      method: config.method,
      userId: sessionManager.currentSession?.userId
    };

    // Update session activity
    sessionManager.updateActivity();

    // Log request in development
    if (import.meta.env.MODE === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        rateLimit: rateLimitCheck,
        hasAuth: !!token,
        hasCSRF: !!csrfProtection.getToken(),
        deviceFingerprint: sessionManager.deviceFingerprint?.substring(0, 8) + '...'
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Setup Error:', error);

    // Log security events for request setup failures
    if (error.status === 429) {
      sessionManager.logSecurityEvent('RATE_LIMIT_VIOLATION', {
        endpoint: error.config?.url,
        retryAfter: error.retryAfter
      });
    }

    return Promise.reject(error);
  }
);

// Response interceptor with advanced security integration
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculate response time
    const responseTime = new Date() - response.config.metadata.startTime;

    // Update session activity on successful response
    sessionManager.updateActivity();

    // Log successful response in development
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url} (${responseTime}ms)`, {
        sessionId: sessionManager.currentSession?.id?.substring(0, 8) + '...',
        deviceFingerprint: sessionManager.deviceFingerprint?.substring(0, 8) + '...',
        rateLimitStatus: rateLimiter.getRateLimitStatus(
          response.config.url,
          sessionManager.currentSession?.userId
        )
      });
    }

    // Check for security headers in response
    if (response.headers['x-security-event']) {
      sessionManager.logSecurityEvent('SERVER_SECURITY_EVENT', {
        event: response.headers['x-security-event'],
        endpoint: response.config.url
      });
    }

    return response;
  },
  async (error) => {
    const { response, config } = error;

    // Calculate response time even for errors
    if (config?.metadata) {
      const responseTime = new Date() - config.metadata.startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`❌ API Error: ${response?.status || 'Network'} ${config.url} (${responseTime}ms)`, {
          error: error.message,
          sessionId: sessionManager.currentSession?.id?.substring(0, 8) + '...',
          deviceFingerprint: sessionManager.deviceFingerprint?.substring(0, 8) + '...',
          rateLimitStatus: rateLimiter.getRateLimitStatus(
            config.url,
            sessionManager.currentSession?.userId
          )
        });
      }
    }

    // Handle rate limiting errors
    if (error.status === 429) {
      sessionManager.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        endpoint: config?.url,
        retryAfter: error.retryAfter
      });

      return Promise.reject(new Error(`Rate limit exceeded. Try again in ${error.retryAfter} seconds.`));
    }

    // Handle different error types with enhanced security
    if (response?.status === 401) {
      // Unauthorized - token might be expired
      sessionManager.logSecurityEvent('UNAUTHORIZED_ACCESS', {
        endpoint: config?.url,
        userAgent: navigator.userAgent
      });

      // Clear session and tokens
      sessionManager.currentSession = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }

      return Promise.reject(new Error('Authentication required'));
    }

    if (response?.status === 403) {
      // Forbidden - insufficient permissions or CSRF failure
      sessionManager.logSecurityEvent('ACCESS_FORBIDDEN', {
        endpoint: config?.url,
        method: config?.method,
        hasCSRF: !!config?.headers?.['X-CSRF-Token']
      });

      return Promise.reject(new Error('Access denied'));
    }

    if (response?.status === 404) {
      // Not found
      return Promise.reject(new Error('Resource not found'));
    }

    if (response?.status === 419) {
      // CSRF token mismatch
      sessionManager.logSecurityEvent('CSRF_TOKEN_MISMATCH', {
        endpoint: config?.url,
        method: config?.method
      });

      // Refresh CSRF token and retry once
      csrfProtection.generateToken();
      return Promise.reject(new Error('Security token expired. Please try again.'));
    }

    if (response?.status >= 500) {
      // Server errors
      sessionManager.logSecurityEvent('SERVER_ERROR', {
        status: response.status,
        endpoint: config?.url,
        method: config?.method
      });

      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    // Network errors
    if (!response) {
      sessionManager.logSecurityEvent('NETWORK_ERROR', {
        endpoint: config?.url,
        method: config?.method
      });

      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // Handle validation errors
    if (response?.status === 422 && response.data?.errors) {
      const validationErrors = response.data.errors;
      const errorMessages = Object.values(validationErrors).flat();
      return Promise.reject(new Error(errorMessages.join(', ')));
    }

    // Handle custom error messages from backend
    if (response?.data?.message) {
      return Promise.reject(new Error(response.data.message));
    }

    // Generic error fallback
    return Promise.reject(new Error('An unexpected error occurred'));
  }
);

// Retry mechanism for failed requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on authentication or validation errors
      if (error.message?.includes('Authentication') ||
          error.message?.includes('Access denied') ||
          error.message?.includes('validation')) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.log(`🔄 Retrying request (attempt ${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
};

// Enhanced API methods with better error handling
export const apiGet = async (url, config = {}) => {
  return retryRequest(() => axiosInstance.get(url, config));
};

export const apiPost = async (url, data = {}, config = {}) => {
  return retryRequest(() => axiosInstance.post(url, data, config));
};

export const apiPut = async (url, data = {}, config = {}) => {
  return retryRequest(() => axiosInstance.put(url, data, config));
};

export const apiPatch = async (url, data = {}, config = {}) => {
  return retryRequest(() => axiosInstance.patch(url, data, config));
};

export const apiDelete = async (url, config = {}) => {
  return retryRequest(() => axiosInstance.delete(url, config));
};

// File upload helper
export const apiUpload = async (url, file, additionalData = {}, onProgress) => {
  const formData = new FormData();

  // Add file
  if (file) {
    formData.append('file', file);
  }

  // Add additional data
  Object.keys(additionalData).forEach(key => {
    formData.append(key, additionalData[key]);
  });

  return axiosInstance.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total > 0) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};

// Batch requests helper
export const apiBatch = async (requests) => {
  try {
    const responses = await Promise.allSettled(requests);

    const results = responses.map((response, index) => ({
      index,
      status: response.status,
      data: response.status === 'fulfilled' ? response.value?.data : null,
      error: response.status === 'rejected' ? response.reason?.message : null,
    }));

    return results;
  } catch (error) {
    throw new Error(`Batch request failed: ${error.message}`);
  }
};

// Health check function
export const checkApiHealth = async () => {
  try {
    // Health endpoint is not under /api prefix
    const response = await axios.get('http://localhost:5500/health', {
      timeout: 5000,
    });
    return {
      status: 'healthy',
      response: response.data,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

export default axiosInstance;
