import type { Warehouse } from '@/types';
import { apiFetch } from './api';

export async function fetchWarehouses(): Promise<Warehouse[]> {
  return apiFetch<Warehouse[]>('/warehouses');
}

