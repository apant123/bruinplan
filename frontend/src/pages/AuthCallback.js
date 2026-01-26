import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;

    navigate(isAuthenticated ? "/onboarding" : "/login", { replace: true });
  }, [loading, isAuthenticated, navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Signing you in…</h2>
      <p>Please wait.</p>
    </div>
  );
}
