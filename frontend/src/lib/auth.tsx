"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface LocalSession {
  access_token: string;
  user_id: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  session: LocalSession | null;
  loading: boolean;
  accessToken: string | null;
  signOut: () => Promise<void>;
  setSession: (s: LocalSession | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  accessToken: null,
  signOut: async () => {},
  setSession: () => {},
});

const SESSION_KEY = "ea_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setSessionState(JSON.parse(stored));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const setSession = useCallback((s: LocalSession | null) => {
    setSessionState(s);
    if (s) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const signOut = useCallback(async () => {
    setSession(null);
  }, [setSession]);

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        accessToken: session?.access_token ?? null,
        signOut,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
