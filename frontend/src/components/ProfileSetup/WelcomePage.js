import React, { useState } from "react";
import './WelcomePage.css';
import { supabase } from "../../supabaseClient"; // note: two levels up


function WelcomePage({ onNext }) {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setError("");
    setLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
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
          <li>Login</li>
          <li>Connect with DARS (optional)</li>
          <li>Major and minor</li>
          <li>Expected graduation date</li>
        </ul>
      </div>

      <button className="primary-button" onClick={signInWithGoogle} disabled={loading}>
        {loading ? "Redirecting..." : "Get Started with Google"}
      </button>

      <button className="secondary-button" onClick={onNext} disabled={loading}>
        Continue without Google
      </button>

      {error && <div className="login-error">{error}</div>}
    </div>
  );
}

export default WelcomePage;
