import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { apiGetProfile } from "../api/auth"; // GET /api/user/ with Bearer token

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);          // supabase session
  const [accessToken, setAccessToken] = useState(null);  // JWT
  const [profile, setProfile] = useState(null);          // from your Django UserProfile
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!accessToken;

  // Keep session in sync with Supabase
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sess = data?.session ?? null;
      setSession(sess);
      setAccessToken(sess?.access_token ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setAccessToken(sess?.access_token ?? null);
      if (!sess) setProfile(null);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // When token exists, fetch backend profile
  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      try {
        const p = await apiGetProfile(accessToken);
        setProfile(p);
      } catch (e) {
        // If profile doesn't exist yet, that’s fine during onboarding
        // Just keep profile null and let wizard create/update it.
        console.warn("Failed to load profile:", e.message);
      }
    })();
  }, [accessToken]);

  // Use Supabase for signup/login (real auth)
  const signup = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    // Depending on Supabase settings, session may be null until email confirm
    return data;
  };

  const login = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = {
    loading,
    isAuthenticated,
    accessToken,
    session,
    profile,
    setProfile, // wizard will call this after updating backend
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
