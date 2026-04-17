import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../api/constants';

function AuthCallback() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  useEffect(() => {
    const handleGoogleLogin = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.error("Error or no session found:", error);
        navigate('/login');
        return;
      }
      
      // We have the session. Send to our backend googleLogin endpoint
      try {
        const response = await fetch(`${API_BASE}/api/auth/googleLogin/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + session.access_token
          },
          body: JSON.stringify({ email: session.user.email }),
        });

        const data = await response.json();

        if (response.status === 202) {
          // Profile not found, needs setup
          localStorage.setItem("accessToken", session.access_token);
          // Pass google=true and pre-fill data using URL search params
          const email = session.user.email;
          const name = session.user.user_metadata?.full_name || '';
          navigate(`/signup?google=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
        } else if (response.ok) {
          localStorage.setItem("accessToken", session.access_token);
          signup(data.user);
          navigate("/profile");
        } else {
          throw new Error(data.error || "Login failed");
        }
      } catch (err) {
        console.error("Backend login error:", err);
        navigate('/login');
      }
    };

    handleGoogleLogin();
  }, [navigate, signup]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: "#247ad6", marginBottom: "10px" }}>Authenticating...</h2>
        <p style={{ color: "#666" }}>Please wait while we log you in via Google.</p>
      </div>
    </div>
  );
}

export default AuthCallback;
