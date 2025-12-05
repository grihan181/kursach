import type { OrderDetail, OrderStatus, OrderSummary } from '@/types';
import { apiFetch } from './api';

const fallbackOrders: OrderDetail[] = [
  {
    id: 'ord-1001',
    title: 'Доставка оборудования',
    status: 'processing',
    total: 3200,
    description: 'Демо-заказ с оборудованием и аксесуарами',
    createdAt: new Date().toISOString(),
    permissions: { canChangeStatus: true },
    history: ['new', 'processing']
  },
  {
    id: 'ord-1002',
    title: 'Печать материалов',
    status: 'new',
    total: 780,
    description: 'Буклеты и каталоги',
    createdAt: new Date().toISOString(),
    permissions: { canChangeStatus: false },
    history: ['new']
  }
];

export async function fetchOrders(): Promise<OrderSummary[]> {
  try {
    return await apiFetch<OrderSummary[]>('/orders');
  } catch (error) {
    console.warn('Falling back to static orders', error);
    return fallbackOrders;
  }
}

export async function fetchOrderDetail(id: string): Promise<OrderDetail> {
  try {
    return await apiFetch<OrderDetail>(`/orders/${id}`);
  } catch (error) {
    console.warn('Falling back to static order detail', error);
    const order = fallbackOrders.find((item) => item.id === id) ?? fallbackOrders[0];
    return order;
  }
}

export async function createOrder(input: Partial<OrderDetail>): Promise<OrderDetail> {
  try {
    return await apiFetch<OrderDetail>('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  } catch (error) {
    console.warn('Falling back to static create order', error);
    const newOrder: OrderDetail = {
      id: `ord-${Date.now()}`,
      title: input.title || 'Новый заказ',
      status: input.status ?? 'new',
      total: input.total ?? 0,
      description: input.description ?? '',
      createdAt: new Date().toISOString(),
      permissions: { canChangeStatus: true },
      history: ['new']
    };
    fallbackOrders.unshift(newOrder);
    return newOrder;
  }
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderDetail> {
  try {
    return await apiFetch<OrderDetail>(`/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  } catch (error) {
    console.warn('Falling back to static status change', error);
    const order = fallbackOrders.find((item) => item.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    order.status = status;
    order.history.push(status);
    return order;
  }
}
