// API Service - Centralized API calls using enhanced axios configuration

import axiosInstance, {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiUpload,
  apiBatch,
  checkApiHealth
} from './axios';

// Authentication API calls
export const authAPI = {
  // User registration
  register: (userData) => apiPost('/auth/register', userData),

  // User login
  login: (credentials) => apiPost('/auth/login', credentials),

  // Verify token
  verifyToken: () => apiGet('/auth/verify'),

  // Refresh token
  refreshToken: () => apiPost('/auth/refresh'),

  // Logout
  logout: () => apiPost('/auth/logout'),

  // Forgot password
  forgotPassword: (email) => apiPost('/auth/forgot-password', { email }),

  // Reset password
  resetPassword: (token, password) => apiPost('/auth/reset-password', { token, password }),

  // Change password
  changePassword: (currentPassword, newPassword) =>
    apiPost('/auth/change-password', { currentPassword, newPassword }),

  // Get user profile
  getProfile: () => apiGet('/auth/profile'),

  // Update user profile
  updateProfile: (profileData) => apiPut('/auth/profile', profileData),
};

// Questions API calls
export const questionsAPI = {
  // Get all questions with filters
  getQuestions: (params = {}) => apiGet('/questions', { params }),

  // Get single question
  getQuestion: (id) => apiGet(`/questions/${id}`),

  // Create new question
  createQuestion: (questionData) => apiPost('/questions', questionData),

  // Update question
  updateQuestion: (id, questionData) => apiPut(`/questions/${id}`, questionData),

  // Delete question
  deleteQuestion: (id) => apiDelete(`/questions/${id}`),

  // Vote on question
  voteQuestion: (id, voteType) => apiPost(`/questions/${id}/vote`, { voteType }),

  // Search questions
  searchQuestions: (query, filters = {}) =>
    apiGet('/questions/search', { params: { q: query, ...filters } }),
};

// Answers API calls
export const answersAPI = {
  // Get answers for a question
  getAnswers: (questionId) => apiGet(`/answers/${questionId}`),

  // Add answer to question
  addAnswer: (questionId, answerData) => apiPost(`/answers/${questionId}`, answerData),

  // Update answer
  updateAnswer: (questionId, answerId, answerData) =>
    apiPut(`/answers/${questionId}/${answerId}`, answerData),

  // Delete answer
  deleteAnswer: (questionId, answerId) =>
    apiDelete(`/answers/${questionId}/${answerId}`),

  // Vote on answer
  voteAnswer: (questionId, answerId, voteData) =>
    apiPost(`/answers/${questionId}/${answerId}/vote`, voteData),

  // Mark answer as accepted
  acceptAnswer: (questionId, answerId) =>
    apiPost(`/answers/${questionId}/${answerId}/accept`),
};

// Admin API calls
export const adminAPI = {
  // Get all users
  getUsers: (params = {}) => apiGet('/admin/users', { params }),

  // Get user by ID
  getUser: (id) => apiGet(`/admin/users/${id}`),

  // Update user
  updateUser: (id, userData) => apiPut(`/admin/users/${id}`, userData),

  // Delete user
  deleteUser: (id) => apiDelete(`/admin/users/${id}`),

  // Get system statistics
  getStats: () => apiGet('/admin/stats'),

  // Moderate content
  moderateContent: (contentId, action, reason) =>
    apiPost('/admin/moderate', { contentId, action, reason }),

  // Get reports
  getReports: (params = {}) => apiGet('/admin/reports', { params }),
};

// File upload API calls
export const fileAPI = {
  // Upload single file
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return apiUpload('/upload', file, {}, onProgress);
  },

  // Upload multiple files
  uploadFiles: (files, onProgress) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    return apiUpload('/upload/multiple', null, formData, onProgress);
  },

  // Delete file
  deleteFile: (fileId) => apiDelete(`/upload/${fileId}`),
};

// Utility functions
export const apiUtils = {
  // Health check
  healthCheck: checkApiHealth,

  // Batch operations
  batch: apiBatch,

  // Retry wrapper for custom requests
  retry: (requestFn, maxRetries = 3) => {
    return axiosInstance.retryRequest ?
      axiosInstance.retryRequest(requestFn, maxRetries) :
      requestFn();
  },
};

// AI API calls
export const aiAPI = {
  // Chat with AI
  chatWithAI: (data) => apiPost('/ai/chat', data),

  // Get code help
  getCodeHelp: (data) => apiPost('/ai/code-help', data),

  // Get user's conversations
  getConversations: () => apiGet('/ai/conversations'),

  // Get messages for a conversation
  getConversationMessages: (conversationId) =>
    apiGet(`/ai/conversations/${conversationId}/messages`),
};

// Export all APIs as a single object for convenience
export const API = {
  auth: authAPI,
  questions: questionsAPI,
  answers: answersAPI,
  admin: adminAPI,
  files: fileAPI,
  ai: aiAPI,
  utils: apiUtils,
};

export default API;