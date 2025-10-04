import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axiosInstance from '../API/axios';
import { API } from '../API/apiService';
import { useUser } from './UserProvider';

// Helpers to normalize API responses from SQL backend to client shape
const normalizeQuestion = (q = {}) => {
  const votes = q.votes || {
    up: q.upvotes || 0,
    down: q.downvotes || 0,
    score: typeof q.vote_score === 'number'
      ? q.vote_score
      : ((q.upvotes || 0) - (q.downvotes || 0))
  };

  let tags = q.tags;
  if (!Array.isArray(tags)) {
    try { tags = JSON.parse(q.tags || '[]'); } catch { tags = []; }
  }

  return {
    ...q,
    _id: q._id ?? q.id,
    id: q.id ?? q._id,
    createdAt: q.createdAt ?? q.created_at,
    updatedAt: q.updatedAt ?? q.updated_at,
    tags,
    votes
  };
};

const normalizeAnswer = (a = {}) => ({
  ...a,
  _id: a._id ?? a.id,
  id: a.id ?? a._id,
  isAccepted: a.isAccepted ?? a.is_accepted,
  createdAt: a.createdAt ?? a.created_at,
  updatedAt: a.updatedAt ?? a.updated_at,
  author: a.author ?? (a.username ? { username: a.username, role: a.role } : undefined),
  votes: a.votes ?? {
    up: a.upvotes || 0,
    down: a.downvotes || 0
  }
});
const QuestionContext = createContext();

export const useQuestions = () => {
  const context = useContext(QuestionContext);
  if (!context) {
    throw new Error('useQuestions must be used within a QuestionProvider');
  }
  return context;
};

const QuestionProvider = ({ children }) => {
  const { isAuthenticated } = useUser();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: 'newest',
    search: ''
  });

  // Fetch all questions with filters
  const fetchQuestions = useCallback(async (page = 1, limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await axiosInstance.get(`/questions?${params}`);
      const api = response.data || {};
      const fetched = Array.isArray(api.questions) ? api.questions : (api.data || []);
      const normalized = fetched.map(normalizeQuestion);

      setQuestions(normalized);

      const pagination = api.pagination || {};
      return {
        questions: normalized,
        totalPages: pagination.totalPages ?? api.totalPages ?? 1,
        currentPage: pagination.currentPage ?? api.currentPage ?? page,
        total: pagination.total ?? api.total ?? normalized.length
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch questions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch single question with answers
  const fetchQuestion = useCallback(async (id) => {
    // Validate ID parameter
    if (!id || id === 'undefined' || id.trim() === '') {
      const errorMessage = 'Invalid question ID provided';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/questions/${id}`);
      const api = response.data || {};
      const q = normalizeQuestion(api);
      q.answers = (api.answers || []).map(normalizeAnswer);
      setCurrentQuestion(q);
      return q;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new question
  const createQuestion = useCallback(async (questionData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/questions', questionData);
      // Backend returns { message, question }
      const api = response.data || {};
      const created = normalizeQuestion(api.question || api);

      // Add to questions list if it matches current filters
      setQuestions(prev => [created, ...prev]);

      return created;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update question
  const updateQuestion = useCallback(async (id, questionData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    if (!id || id === 'undefined' || id.trim() === '') {
      throw new Error('Invalid question ID provided');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.put(`/questions/${id}`, questionData);
      // Backend returns { message, question }
      const api = response.data || {};
      const updatedQuestion = normalizeQuestion(api.question || api);

      // Update in questions list
      setQuestions(prev =>
        prev.map(q => (q._id === id || q.id === id) ? updatedQuestion : q)
      );

      // Update current question if it's the same
      if (currentQuestion?._id === id || currentQuestion?.id === id) {
        setCurrentQuestion(updatedQuestion);
      }

      return updatedQuestion;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentQuestion]);

  // Delete question
  const deleteQuestion = useCallback(async (id) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    if (!id || id === 'undefined' || id.trim() === '') {
      throw new Error('Invalid question ID provided');
    }

    setLoading(true);
    setError(null);

    try {
      await axiosInstance.delete(`/questions/${id}`);

      // Remove from questions list
      setQuestions(prev => prev.filter(q => q._id !== id));

      // Clear current question if it's the deleted one
      if (currentQuestion?._id === id) {
        setCurrentQuestion(null);
      }

      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentQuestion]);

  // Vote on question
  const voteQuestion = useCallback(async (id, voteType) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      const response = await API.questions.voteQuestion(id, voteType);

      // Update question in list
      setQuestions(prev =>
        prev.map(q =>
          (q._id === id || q.id === id)
            ? { ...q, votes: response.votes, userVote: response.userVote }
            : q
        )
      );

      // Update current question if it's the same
      if (currentQuestion?._id === id || currentQuestion?.id === id) {
        setCurrentQuestion(prev => ({
          ...prev,
          votes: response.votes,
          userVote: response.userVote
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to vote';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, currentQuestion]);

  // Add answer to question
  const addAnswer = useCallback(async (questionId, answerData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      const response = await API.answers.addAnswer(questionId, answerData);

      // Update current question with new answer
      if (currentQuestion?._id === questionId || currentQuestion?.id === questionId) {
        setCurrentQuestion(prev => ({
          ...prev,
          answers: [...(prev.answers || []), response]
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add answer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, currentQuestion]);

  // Update answer
  const updateAnswer = useCallback(async (questionId, answerId, answerData) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      const response = await API.answers.updateAnswer(questionId, answerId, answerData);

      // Update in current question
      if (currentQuestion?._id === questionId || currentQuestion?.id === questionId) {
        setCurrentQuestion(prev => ({
          ...prev,
          answers: prev.answers.map(a =>
            (a._id === answerId || a.id === answerId) ? response : a
          )
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update answer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, currentQuestion]);

  // Delete answer
  const deleteAnswer = useCallback(async (questionId, answerId) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      await API.answers.deleteAnswer(questionId, answerId);

      // Remove from current question
      if (currentQuestion?._id === questionId || currentQuestion?.id === questionId) {
        setCurrentQuestion(prev => ({
          ...prev,
          answers: prev.answers.filter(a => a._id !== answerId && a.id !== answerId)
        }));
      }

      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete answer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, currentQuestion]);

  // Vote on answer
  const voteAnswer = useCallback(async (questionId, answerId, voteType) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      const response = await API.answers.voteAnswer(questionId, answerId, { voteType });

      // Update answer in current question
      if (currentQuestion?._id === questionId || currentQuestion?.id === questionId) {
        setCurrentQuestion(prev => ({
          ...prev,
          answers: prev.answers.map(a =>
            (a._id === answerId || a.id === answerId)
              ? { ...a, votes: response.votes, userVote: response.userVote }
              : a
          )
        }));
      }

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to vote on answer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated, currentQuestion]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current question
  const clearCurrentQuestion = useCallback(() => {
    setCurrentQuestion(null);
  }, []);

  const value = {
    // State
    questions,
    currentQuestion,
    loading,
    error,
    filters,

    // Actions
    fetchQuestions,
    fetchQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    voteQuestion,
    voteAnswer,
    addAnswer,
    updateAnswer,
    deleteAnswer,
    updateFilters,
    clearError,
    clearCurrentQuestion,

    // Computed values
    totalQuestions: questions.length,
    hasQuestions: questions.length > 0,
    hasCurrentQuestion: !!currentQuestion
  };

  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
};

export default QuestionProvider;