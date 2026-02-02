import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue planning your degree</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@ucla.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-options">
            <label className="login-remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <span className="login-forgot-password">Forgot password?</span>
          </div>

          <button type="submit" className="login-submit-btn">Sign In</button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <span className="login-signup-link" onClick={() => navigate('/signup')}>Sign up</span></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
