import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../API/apiService';
import './ForgetPassword.css';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await API.auth.forgotPassword(email);
      setEmailSent(true);
      setMessage('Password reset instructions have been sent to your email address.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forget-password-page">
      <div className="forget-password-container">
        <div className="forget-password-header">
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you instructions to reset your password</p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit} className="forget-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="📧 Enter your email address"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ↻ Sending...
                </>
              ) : (
                <>
                  📧 Send Reset Instructions
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <div className="success-icon">📧</div>
            <h3>Email Sent!</h3>
            <p>{message}</p>
            <p className="note">Didn't receive the email? Check your spam folder or try again.</p>
          </div>
        )}

        <div className="forget-password-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;