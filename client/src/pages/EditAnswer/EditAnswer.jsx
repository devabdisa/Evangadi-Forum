import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import styles from "./EditAnswer.module.css";
import { UserContext } from "../../context/UserProvider";
import DOMPurify from "dompurify";
import axiosInstance from "../../API/axios";

function EditAnswer() {
  const { answer_id } = useParams(); // Get answer ID from URL
  const navigate = useNavigate(); // Navigate after update or discard
  const [user] = useContext(UserContext); // Current logged-in user
  const token = localStorage.getItem("token"); // JWT token
  const [loading, setLoading] = useState(true); // Loading state while fetching answer
  const [error, setError] = useState(""); // Error messages
  const [answer, setAnswer] = useState(""); // Current answer content
  const [originalAnswer, setOriginalAnswer] = useState(""); // Original answer to allow discard

  // Fetch answer data on mount
  useEffect(() => {
    const fetchAnswer = async () => {
      try {
        const response = await axiosInstance.get(`/answers/${answer_id}`);

        // Set answer content and original content
        setAnswer(response.data.answer || "");
        setOriginalAnswer(response.data.answer || "");
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load answer data.");
        setLoading(false);
      }
    };

    if (token) {
      fetchAnswer();
    }
  }, [answer_id, token]);

  // Handle form submission to update answer
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!answer.trim()) {
      setError("Answer cannot be empty");
      return;
    }

    try {
      // Update answer on backend
      await axiosInstance.put(`/answers/${answer_id}`, {
        answer: answer.trim(),
      });

      navigate(-1); // Go back to previous page after successful update
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update answer. Please try again.");
    }
  };

  // Discard changes and reset to original answer
  const handleDiscard = () => {
    setAnswer(originalAnswer); // Reset content to original
    navigate(-1); // Go back to previous page
  };

  // Show loading while fetching
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading answer...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Edit Your Answer</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Answer input field */}
        <div className={styles.formGroup}>
          <label htmlFor="answer" className={styles.label}>
            Your Answer
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className={styles.textarea}
            placeholder="Edit your answer here..."
            rows="12"
            required
          />
        </div>

        {/* Action buttons */}
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.submitButton}>
            Save Changes
          </button>
          <button
            type="button"
            className={styles.discardButton}
            onClick={handleDiscard}
          >
            Discard Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditAnswer;
