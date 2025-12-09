'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { refreshTokenStorageKey, tokenStorageKey } from '@/config';
import type { AuthResponse } from '@/types';
import { logout, me, refreshSession } from '@/services/auth';

type AuthState = {
  user: AuthResponse['user'] | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: AuthState['user'], token: string | null) => void;
  handleLogout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAccess = typeof window !== 'undefined' ? localStorage.getItem(tokenStorageKey) : null;
    const storedRefresh = typeof window !== 'undefined' ? localStorage.getItem(refreshTokenStorageKey) : null;
    if (!storedAccess && !storedRefresh) {
      setLoading(false);
      return;
    }

    const tryLoad = async () => {
      try {
        const tokenToUse = storedAccess;
        if (tokenToUse) {
          setToken(tokenToUse);
          const u = await me(tokenToUse);
          setUser(u);
          setLoading(false);
          return;
        }
        if (storedRefresh) {
          const refreshed = await refreshSession(storedRefresh);
          setToken(refreshed.accessToken ?? null);
          setUser(refreshed.user ?? null);
          setLoading(false);
          return;
        }
      } catch {
        logout();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    tryLoad();
  }, []);

  const setAuth = (nextUser: AuthState['user'], nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextToken && typeof window !== 'undefined') {
      localStorage.setItem(tokenStorageKey, nextToken);
    }
  };

  const handleLogout = useCallback(() => {
    logout();
    setAuth(null, null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      setAuth,
      handleLogout
    }),
    [user, token, loading, handleLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
