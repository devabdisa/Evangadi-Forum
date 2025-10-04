import { useState } from "react";
import axios from "../../API/axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import "./SignUp.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (
      !formData.username ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      toast.error("All fields are required!");
      setLoading(false);
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("/users/register", {
        username: formData.username,
        firstname: formData.firstName, // ✅ FIXED: firstname (no underscore)
        lastname: formData.lastName, // ✅ FIXED: lastname (no underscore)
        email: formData.email,
        password: formData.password,
      });

      if (res.status === 201) {
        toast.success("Signup successful! Please log in.");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error?.response?.data?.msg || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrapper-container">
      {/* Registration Section */}
      <div className="register-page">
        <div className="register-box">
          <h2>Join the Network</h2>
          <form onSubmit={handleSubmit}>
            <div className="name-fields">
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                className="input-field"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                className="input-field"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="input-field"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="input-field"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="input-field"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
          <p className="switch-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>

      {/* About container section */}
      <div className="container">
        <h3>About</h3>
        <h1>Evangadi Network</h1>
        <div>
          <p>
            No matter what stage of life you are in, whether you're starting
            elementary school or being promoted to CEO of a Fortune 500 company,
            you have much to offer to those who are trying to follow in your
            footsteps.
          </p>
          <p>
            Whether you are willing to share your knowledge or you are just
            looking to meet mentors of your own, please start by joining the
            network here.
          </p>
          <a href="/HowItWorks">
            <button className="button">HOW IT WORKS</button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;
