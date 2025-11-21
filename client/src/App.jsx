import { useContext, useState, useEffect } from "react";
import { UserContext } from "./context/UserProvider";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import axiosInstance from "./API/axios";
import ProtectedRoute from "./context/ProtectedRoutes";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import LandingPage from "./pages/LandingPage/LandingPage";
import HomePage from "./components/HomePage/Homepage";
import AskQuestion from "./pages/AskQuestion/AskQuestion";
import QuestionDetail from "./pages/QuestionDetail/QuestionDetail";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import { jwtDecode } from "jwt-decode";
import HowItWorks from "./pages/HowItWorks/HowItWorks";
import ForgetPassword from "./pages/ForgetPassword/ForgetPassword";
import EditQuestion from "./pages/EditQuestion/EditQuestion";
import EditAnswer from "./pages/EditAnswer/EditAnswer";

function App() {
  // Access user state from context
  const [user, setUser] = useContext(UserContext);
  const [loading, setLoading] = useState(true); // Shows loading state while checking authentication
  const [error, setError] = useState(null); // Stores any authentication error messages
  const token = localStorage.getItem("token"); // Get JWT token from localStorage
  const navigate = useNavigate(); // For programmatic navigation

  // Function to check if the token is expired
  function isTokenExpired(token) {
    try {
      const decoded = jwtDecode(token);
      // JWT exp is in seconds, convert to milliseconds and compare with current time
      return decoded.exp * 1000 < Date.now();
    } catch (e) {
      // If decoding fails, treat token as expired
      return true;
    }
  }

  // Function to check user authentication
  async function checkUser() {
    if (!token || isTokenExpired(token)) {
      // If no token or token expired, log the user out
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Verify the token with backend
      const { data } = await axiosInstance.get("/users/check", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Decode the token to extract user info
      const decoded = jwtDecode(token);
      setUser({
        user_id: decoded.userid, // Map token field to context field
        user_name: decoded.username,
        token: token,
      });
      
    } catch (error) {
      console.error("Authentication error:", error.message);
      // If any error occurs during check, remove token and log out
      localStorage.removeItem("token");
      setUser(null);
      setError("Failed to authenticate. Please log in again.");
    } finally {
      setLoading(false); // Done checking user
    }
  }

  // Check authentication when the app loads or token changes
  useEffect(() => {
    if (token) {
      checkUser();
    } else {
      setLoading(false);
      setUser(null); // Ensure user is null if no token
    }
  }, [token]);

  // Log when user context changes (for debugging)
  useEffect(() => {
    if (user) {
      console.log("🔄 App - User context updated:", user);
    }
  }, [user]);

  // Show loader while checking user
  if (loading) {
    return (
      <div className="loader">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header is visible on all pages */}
      <Header />

      <div>
        <Routes>
          {/* ----------------------- PUBLIC ROUTES ----------------------- */}
          {/* Landing page and login/register routes */}
          <Route
            path="/"
            element={token ? <Navigate to="/home" /> : <LandingPage />}
          />
          <Route
            path="/users/login"
            element={token ? <Navigate to="/home" /> : <Login />}
          />
          <Route
            path="/users/register"
            element={token ? <Navigate to="/home" /> : <SignUp />}
          />
          <Route
            path="/forget-password"
            element={token ? <Navigate to="/home" /> : <ForgetPassword />}
          />
          <Route path="/how-it-works" element={<HowItWorks />} />

          {/* ----------------------- PROTECTED ROUTES ----------------------- */}
          {/* User must be logged in to access these */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questions/:question_id"
            element={
              <ProtectedRoute>
                <QuestionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ask"
            element={
              <ProtectedRoute>
                <AskQuestion />
              </ProtectedRoute>
            }
          />
          {/* Edit question/answer pages */}
          <Route
            path="/edit-question/:question_id"
            element={
              <ProtectedRoute>
                <EditQuestion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-answer/:answer_id"
            element={
              <ProtectedRoute>
                <EditAnswer />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {/* Footer is visible on all pages */}
      <Footer />
    </div>
  );
}

export default App;
