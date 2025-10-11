'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserSupabase();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('🔄 Initializing auth...');
      
      // Get current session from Supabase
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      
      // Check if user just logged in
      const justLoggedIn = sessionStorage.getItem('swaply_just_logged_in');
      
      // Check if user just logged out
      const justLoggedOut = sessionStorage.getItem('swaply_just_logged_out');
      
      if (justLoggedOut) {
        // User JUST logged out - clear everything
        console.log('🚪 Just logged out - clearing session');
        sessionStorage.removeItem('swaply_just_logged_out');
        await supabase.auth.signOut({ scope: 'local' });
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } else if (justLoggedIn || existingSession) {
        // User just logged in OR has valid session - keep it
        if (justLoggedIn) {
          console.log('✅ Just logged in - keeping session');
          sessionStorage.removeItem('swaply_just_logged_in');
        } else {
          console.log('🔐 Valid session found - staying logged in');
        }
        
        if (mounted && existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
        }
      } else {
        // No session, no flags - user is logged out
        console.log('� No session - user logged out');
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);

        if (mounted) {
          if (event === 'SIGNED_IN') {
            // User just logged in - set flag
            sessionStorage.setItem('swaply_just_logged_in', 'true');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            console.log('User signed in');
          } else if (event === 'SIGNED_OUT') {
            // User signed out
            sessionStorage.removeItem('swaply_just_logged_in');
            setUser(null);
            setSession(null);
            setLoading(false);
            console.log('User signed out');
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Only refresh if we're already logged in
            setSession(session);
            setUser(session.user);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signOut = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Set logout flag FIRST before clearing anything
      sessionStorage.setItem('swaply_just_logged_out', 'true');
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Clear storage
      sessionStorage.removeItem('swaply_just_logged_in');
      localStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      console.log('💾 Storage cleared, calling logout endpoint...');
      
      // Call server logout (don't wait)
      fetch('/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }).catch(err => console.log('Logout endpoint error (ignorable):', err));

      // Force reload to trigger auth check
      console.log('🔄 Reloading page...');
      window.location.href = '/?t=' + Date.now();
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Fallback
      sessionStorage.setItem('swaply_just_logged_out', 'true');
      localStorage.clear();
      window.location.href = '/?t=' + Date.now();
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.refreshSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook pentru verificarea dacă utilizatorul este autentificat
export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
    }
  }, [user, loading]);

  return { user, loading };
}