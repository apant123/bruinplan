import React from 'react';
import { supabase } from '../../supabaseClient';
import './WelcomePage.css';

function WelcomePage({ onNext }) {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });

    if (error) {
      console.error("Error signing in with Google:", error.message);
      alert("Error signing in with Google: " + error.message);
    }
  };

  return (
    <div className="welcome-card">
      <h1 className="welcome-title">Welcome to Bruin Plan! 🎓</h1>
      <p className="welcome-subtitle">
        Let's set up your profile to personalize your course planning experience. This will only take a minute!
      </p>

      <div className="setup-info-box">
        <h3 className="setup-info-title">What you'll set up:</h3>
        <ul className="setup-info-list">
          <li>Login (Google or Email)</li>
          <li>Connect with DARS (optional)</li>
          <li>Major and minor</li>
          <li>Expected graduation date</li>
        </ul>
      </div>

      <button 
        type="button" 
        className="google-auth-btn" 
        onClick={handleGoogleLogin}
        style={{ marginBottom: '4px' }}
      >
        <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="google-logo" />
        Continue with Google
      </button>

      <div className="auth-separator">
        <span>or set up manually</span>
      </div>

      <button className="primary-button" onClick={onNext}>
        Get Started
      </button>
    </div>
  );
}

export default WelcomePage;
