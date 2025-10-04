import React, { useState, useContext } from "react";
import styles from "./Login.module.css";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserProvider"; // Import UserContext
import axiosInstance from "../../API/axios";
import { ClipLoader } from "react-spinners";

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useContext(UserContext); // Access and update UserContext
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("Both fields are required!");
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post("/users/login", formData);
      setSuccessMessage(response.data.msg);

      localStorage.setItem("token", response.data.token);
      setUser({ token: response.data.token }); // Update the UserContext

      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error.response?.data?.msg || "Something went wrong! Please try again."
      );
    }
    setLoading(false);
  };

  return (
    <section className={styles.loginContainer}>
      <div className={styles.leftWrapper}>
        <div className={styles.formContainer}>
          <h1>Login</h1>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && (
              <div className={styles.success}>{successMessage}</div>
            )}

            <h3 className={styles.forgot__password}>
              <Link to="/forget-password">Forgot your password?</Link>
            </h3>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ClipLoader size={20} color="#36d7b7" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <h3 className={styles.registerLink}>
            Don't have an account?{" "}
            <Link
              className={styles["text-pr"]}
              style={{ color: "orange" }}
              to="/users/register"
            >
              Sign up
            </Link>
          </h3>
        </div>
      </div>

      <div className={styles.rightWrapperLogin}>
        <div className={styles.overridephoto}>
          <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0 40C25.4247 40 40 25.4247 40 0C40 25.4247 54.5753 40 80 40C54.5753 40 40 54.5753 40 80C40 54.5753 25.4247 40 0 40Z"
              fill="#F39228"
            ></path>
          </svg>
          <div className={styles.textContainer}>
            <h1>
              <span>5 Stage</span> Unique Learning Method
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
