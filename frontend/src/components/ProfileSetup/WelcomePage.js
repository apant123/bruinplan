import React from 'react';
import './WelcomePage.css';

function WelcomePage({ onNext }) {
  return (
    <div className="welcome-card">
      <h1 className="welcome-title">Welcome to Bruin Plan! 🎓</h1>
      <p className="welcome-subtitle">
        Let's set up your profile to personalize your course planning experience. This will only take a minute!
      </p>

      <div className="setup-info-box">
        <h3 className="setup-info-title">What you'll set up:</h3>
        <ul className="setup-info-list">
          <li>Login</li>
          <li>Connect with DARS (optional)</li>
          <li>Major and minor</li>
          <li>Expected graduation date</li>
        </ul>
      </div>

      <button className="primary-button" onClick={onNext}>
        Get Started
      </button>
    </div>
  );
}

export default WelcomePage;
