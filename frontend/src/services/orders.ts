import type { OrderDetail, OrderStatus, OrderSummary } from '@/types';
import { apiFetch } from './api';

export type BackendOrder = {
  id: string;
  status: OrderStatus;
  items: string;
  route?: string | null;
  price?: number;
  currency?: string;
  createdAt: string;
};

export function mapOrder(raw: BackendOrder): OrderDetail {
  const parsedItems: Array<{ name: string; qty: number; price?: number }> = (() => {
    try {
      const arr = JSON.parse(raw.items);
      if (Array.isArray(arr)) return arr;
    } catch (e) {
      /* ignore */
    }
    return [];
  })();
  const title = parsedItems[0]?.name || 'Заказ';
  const total = raw.price ?? parsedItems.reduce((sum, item) => sum + (item.price || 0), 0);
  return {
    id: raw.id,
    status: raw.status,
    title,
    total,
    currency: raw.currency,
    description: raw.route ?? '',
    createdAt: raw.createdAt,
    permissions: { canChangeStatus: true },
    history: [raw.status],
    route: raw.route,
    items: parsedItems
  };
}

export async function fetchOrders(): Promise<OrderSummary[]> {
  const data = await apiFetch<BackendOrder[]>('/orders');
  return data.map(mapOrder);
}

export async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  const data = await apiFetch<BackendOrder>(`/orders/${id}`);
  return mapOrder(data);
}

export async function createOrder(input: {
  title: string;
  description?: string;
  items?: Array<{ name: string; qty: number; price?: number }>;
  route?: string;
  pricing?: any;
}): Promise<OrderDetail> {
  const payload = {
    route: input.route,
    items: input.items ?? [{ name: input.title || 'item', qty: 1, price: 0 }],
    pricing: input.pricing
  };
  const created = await apiFetch<BackendOrder>('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return mapOrder(created);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderDetail> {
  const updated = await apiFetch<BackendOrder>(`/orders/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return mapOrder(updated);
}
