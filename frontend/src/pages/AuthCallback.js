import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        navigate("/login", { replace: true });
        return;
      }

      navigate("/onboarding", { replace: true });
    })();
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Signing you in…</h2>
      <p>Please wait.</p>
    </div>
  );
}
