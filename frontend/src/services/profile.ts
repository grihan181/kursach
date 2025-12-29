import type { ProfileUpdatePayload, UserProfile } from '@/types';
import { apiFetch } from './api';

export async function fetchProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/profile');
}

export async function updateProfile(payload: ProfileUpdatePayload): Promise<UserProfile> {
  return apiFetch<UserProfile>('/auth/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}
