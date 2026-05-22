import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    const initAuth = async () => {
      try {
        // First, get the current session from storage
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          initialLoadComplete = true;
          setLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth on mount
    initAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) {
        setSession(s);
        // Only set loading to false after initial load
        if (initialLoadComplete) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
          setSession(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
