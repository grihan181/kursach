import { apiFetch } from './api';
import type { OrderSummary, UserProfile } from '@/types';
import type { BackendOrder } from './orders';
import { mapOrder } from './orders';

export interface DashboardResponse {
  user: UserProfile;
  orders: OrderSummary[];
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const data = await apiFetch<{ user: UserProfile; orders: BackendOrder[] }>('/dashboard');
  return {
    user: data.user,
    orders: (data.orders ?? []).map(mapOrder)
  };
}
