import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { apiGetProfile } from "../api/auth";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!session; // <- change this

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sess = data?.session ?? null;
      setSession(sess);
      setAccessToken(sess?.access_token ?? null);
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      // auth state changed (OAuth callback lands here)
      setLoading(true);

      setSession(sess);
      setAccessToken(sess?.access_token ?? null);
      if (!sess) setProfile(null);

      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    (async () => {
      try {
        const p = await apiGetProfile(accessToken);
        setProfile(p);
      } catch (e) {
        console.warn("Failed to load profile:", e.message);
      }
    })();
  }, [accessToken]);

  const signup = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
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
    setProfile,
    signup,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
