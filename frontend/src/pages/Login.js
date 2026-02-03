import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup } = useAuth();

  const loginUser = async ({ email, password }) => {
    const response = await fetch(
      'http://localhost:8000/api/auth/loginUser/',
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );
  
    const data = await response.json();
  
    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }
  
    return data;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("accessToken", data.accessToken);
      signup(data.user);
      navigate("/profile");
      
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  
    
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
