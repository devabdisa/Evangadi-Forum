import { createContext, useState, useContext } from "react";
import axios from "../API/axios";

// Create a context to share question-related state across the app
export const QuestionContext = createContext();

export function QuestionProvider({ children }) {
  // State to hold all questions
  const [questions, setQuestions] = useState([]);

  // State to hold a single selected question
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Loading state for API requests
  const [loading, setLoading] = useState(false);

  // Error state to store any error messages
  const [error, setError] = useState(null);

  // Function to fetch all questions
  const fetchQuestions = async () => {
    setLoading(true); // Start loading
    setError(null); // Clear any previous errors
    try {
      const response = await axios.get("/question");
      setQuestions(response.data);
    } catch (err) {
      setError("Failed to fetch questions"); // Set error if fetch fails
    } finally {
      setLoading(false); // Stop loading regardless of success/failure
    }
  };

  // Function to fetch a single question by its ID
  const fetchQuestionById = async (questionId) => {
    setLoading(true); // Start loading
    setError(null); // Clear any previous errors
    try {
      const response = await axios.get(`/question/${questionId}`);
      setCurrentQuestion(response.data);
    } catch (err) {
      setError("Failed to fetch question"); // Set error if fetch fails
    } finally {
      setLoading(false); // Stop loading regardless of success/failure
    }
  };

  // Function to add a new question to the local state
  const addQuestion = (newQuestion) => {
    // Prepend the new question so it appears first
    setQuestions((prev) => [newQuestion, ...prev]);
  };

  // Value object that will be accessible via context
  const value = {
    questions,
    currentQuestion,
    loading,
    error,
    fetchQuestions,
    fetchQuestionById,
    addQuestion,
    setQuestions,
    setCurrentQuestion,
  };

  // Provide the context to child components
  return (
    <QuestionContext.Provider value={value}>
      {children}
    </QuestionContext.Provider>
  );
}
