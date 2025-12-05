import { tokenStorageKey } from '@/config';
import type { AuthPayload, AuthResponse } from '@/types';
import { apiFetch } from './api';

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (payload.tokenType === 'bearer' && data.token && typeof window !== 'undefined') {
    localStorage.setItem(tokenStorageKey, data.token);
  }

  return data;
}

export async function register(payload: AuthPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (payload.tokenType === 'bearer' && data.token && typeof window !== 'undefined') {
    localStorage.setItem(tokenStorageKey, data.token);
  }

  return data;
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(tokenStorageKey);
  }
}
