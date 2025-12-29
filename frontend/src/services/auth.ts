import { refreshTokenStorageKey, tokenStorageKey } from '@/config';
import type { AuthPayload, AuthResponse, UserProfile } from '@/types';
import { apiFetch } from './api';

export async function me(token: string): Promise<UserProfile> {
  const data = await apiFetch<UserProfile>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}

function persistTokens(accessToken?: string | null, refreshToken?: string | null) {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem(tokenStorageKey, accessToken);
  if (refreshToken) localStorage.setItem(refreshTokenStorageKey, refreshToken);
}

export async function login(payload: AuthPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const user = pickUser(data);
  const shaped: AuthResponse = { ...data, user };
  if (payload.tokenType === 'bearer') {
    persistTokens(data.accessToken, data.refreshToken);
  }

  return shaped;
}

export async function register(payload: AuthPayload): Promise<AuthResponse> {
  await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  // После регистрации сразу логинимся, чтобы получить access/refresh
  return login(payload);
}

export async function refreshSession(refreshToken: string): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  persistTokens(data.accessToken, data.refreshToken);
  const user = pickUser(data);
  return { ...data, user };
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(refreshTokenStorageKey);
  }
}

function pickUser(data: AuthResponse): UserProfile | null {
  if (data.profile) return data.profile;
  if (data.user) return data.user;
  if (data.id && data.email && data.role) {
    return {
      id: data.id,
      email: data.email,
      role: data.role
    };
  }
  return null;
}
