import type { AdminUser } from '@/types';
import { apiFetch } from './api';

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/auth/admin/users');
}

export async function updateAdminUserRole(id: string, role: 'user' | 'admin'): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/auth/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  });
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiFetch(`/auth/admin/users/${id}`, {
    method: 'DELETE'
  });
}
