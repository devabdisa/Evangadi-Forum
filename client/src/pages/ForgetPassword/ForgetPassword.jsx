import React, { useRef, useState } from "react";
import styles from "./ForgetPassword.module.css";
import { Link } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import axios from "axios"; // Try using axios directly for testing
import axiosInstance from "../../API/axios";
function ForgetPassword() {
  const emailDom = useRef(null); // Ref to directly access the email input DOM element
  const [error, setError] = useState(""); // Stores error messages
  const [success, setSuccess] = useState(""); // Stores success messages
  const [loading, setLoading] = useState(false); // Loading state for submit button

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    const emailValue = emailDom.current.value.trim(); // Get email value from input

    // Basic validation
    if (!emailValue) {
      setError("An email is required");
      return;
    }

    setLoading(true); // Start loading
    setError(""); // Clear previous errors
    setSuccess(""); // Clear previous success messages

    try {
      console.log("🚀 Sending request to /users/forget-password");

      // Send POST request to backend endpoint
      const response = await axiosInstance.post("/users/forget-password", {
        email: emailValue,
      });

      console.log("✅ Success! Response:", response.data);
      setSuccess(response.data.msg); // Show success message from backend
      emailDom.current.value = ""; // Clear input
    } catch (err) {
      console.error("❌ Full error object:", err);

      // Handle different error scenarios
      if (err.code === "NETWORK_ERROR" || err.code === "ECONNREFUSED") {
        setError(
          "Cannot connect to server. Make sure backend is running."
        );
      } else if (err.response?.status === 404) {
        setError("Endpoint not found. Check backend routes.");
      } else {
        setError(
          err.response?.data?.msg ||
            "Something went wrong. Check console for details."
        );
      }
    } finally {
      setLoading(false); // Stop loading in any case
    }
  }

  return (
    <section className={styles.container}>
      <div className={styles.card}>
        <h3>Reset your password</h3>
        <p className={styles.instruction}>
          Enter your email address below, and we will send you an email with
          instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email input field */}
          <input
            ref={emailDom}
            type="email"
            placeholder="Email address"
            className={error ? styles.inputError : styles.input}
            disabled={loading} // Disable input while request is being sent
          />

          {/* Display error message */}
          {error && (
            <div className={styles.error}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Display success message */}
          {success && (
            <div className={styles.success}>
              <strong>Success:</strong> {success}
            </div>
          )}

          {/* Submit button with loading state */}
          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? (
              <div className={styles.loading}>
                <ClipLoader color="#fff" size={12} />
                <span>Sending...</span>
              </div>
            ) : (
              "Reset your password"
            )}
          </button>
        </form>

        {/* Navigation links */}
        <div className={styles.linkContainer}>
          <Link to="/login" className={styles.link}>
            Already have an account?
          </Link>
          <Link to="/signup" className={styles.link}>
            Don't have an account?
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ForgetPassword;
