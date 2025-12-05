'use client';

import { useEffect, useState } from 'react';
import { tokenStorageKey } from '@/config';
import type { AuthResponse } from '@/types';
import { logout } from '@/services/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(tokenStorageKey);
    if (stored) {
      setToken(stored);
      setUser({ id: 'local-user', email: 'you@example.com' });
    }
  }, []);

  const handleLogout = () => {
    logout();
    setToken(null);
    setUser(null);
  };

  return { user, token, setUser, setToken, handleLogout };
}
