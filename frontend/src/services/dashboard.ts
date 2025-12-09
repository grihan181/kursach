import { apiFetch } from './api';
import type { AuthResponse, OrderSummary } from '@/types';
import type { BackendOrder } from './orders';
import { mapOrder } from './orders';

export interface DashboardResponse {
  user: AuthResponse['user'] | { id?: string; email?: string; role?: string };
  orders: OrderSummary[];
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const data = await apiFetch<{ user: any; orders: BackendOrder[] }>('/dashboard');
  return {
    user: data.user,
    orders: (data.orders ?? []).map(mapOrder)
  };
}
