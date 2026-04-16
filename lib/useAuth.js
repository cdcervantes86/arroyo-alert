"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          setIsAnonymous(session.user.is_anonymous || false);
        } else {
          // No session - sign in anonymously
          await signInAnonymously();
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Fallback to anonymous sign-in
        await signInAnonymously();
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsAnonymous(session.user.is_anonymous || false);
        } else if (event === "SIGNED_OUT") {
          // Re-sign in anonymously if signed out
          await signInAnonymously();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInAnonymously = async () => {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error("Anonymous sign-in error:", error);
        return;
      }

      if (data.user) {
        setUser(data.user);
        setIsAnonymous(true);
      }
    } catch (error) {
      console.error("Anonymous sign-in error:", error);
    }
  };

  const linkAccount = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email,
        password,
      });

      if (error) {
        console.error("Account linking error:", error);
        return { error };
      }

      setUser(data.user);
      setIsAnonymous(false);
      return { data };
    } catch (error) {
      console.error("Account linking error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAnonymous(false);
      // Will auto-sign-in anonymously via the listener
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const value = {
    user,
    loading,
    isAnonymous,
    userId: user?.id || null,
    linkAccount,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
