import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { supabase } from "../supabaseClient";


function Login() {
  const navigate = useNavigate();
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

    // If redirect succeeds, you won't reach here in most cases.
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue</p>
        </div>

        <button
          className="google-button"
          onClick={signInWithGoogle}
          disabled={loading}
        >
          {loading ? "Redirecting..." : "Continue with Google"}
        </button>

        {error && <div className="login-error">{error}</div>}

        <div className="login-footer">
          <p>
            Don&apos;t have an account?{" "}
            <span className="signup-link" onClick={() => navigate("/signup")}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
