import type {
  OrderDetail,
  OrderHistoryEntry,
  OrderPermission,
  OrderStage,
  OrderStatus,
  OrderSummary
} from '@/types';
import type { QuoteRequest } from './pricing';
import { apiFetch } from './api';

export type BackendOrder = {
  id: string;
  reference?: string;
  userId: string;
  userEmail?: string | null;
  status: OrderStatus | 'draft';
  items: string;
  route?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  price?: number | null;
  currency?: string | null;
  createdAt: string;
  updatedAt?: string;
  permissions?: Partial<OrderPermission>;
  history?: Array<OrderHistoryEntry>;
  stages?: Array<OrderStage>;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
};

function parseItems(raw: string): Array<{ name: string; qty: number; price?: number }> {
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data.filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}

function mapHistory(entries?: Array<OrderHistoryEntry>): OrderHistoryEntry[] {
  if (!entries) return [];
  return [...entries].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
}

function mapStages(entries?: Array<OrderStage>): OrderStage[] {
  if (!entries) return [];
  return [...entries].sort((a, b) => new Date(a.happenedAt).getTime() - new Date(b.happenedAt).getTime());
}

function mapPermissions(raw?: Partial<OrderPermission>): OrderPermission {
  return {
    canChangeStatus: Boolean(raw?.canChangeStatus),
    canEdit: Boolean(raw?.canEdit),
    canDelete: Boolean(raw?.canDelete)
  };
}

export function mapOrder(raw: BackendOrder): OrderDetail {
  const parsedItems = parseItems(raw.items);
  const title = parsedItems[0]?.name || 'Заявка';
  const fallbackTotal = parsedItems.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const normalizedStatus: OrderStatus = (raw.status === 'draft' ? 'created' : raw.status) as OrderStatus;
  return {
    id: raw.id,
    reference: raw.reference ?? raw.id,
    userId: raw.userId,
    userEmail: raw.userEmail ?? undefined,
    status: normalizedStatus,
    title,
    total: typeof raw.price === 'number' ? raw.price : fallbackTotal,
    currency: raw.currency ?? undefined,
    route: raw.route,
    createdAt: raw.createdAt,
    description: raw.route ?? '',
    permissions: mapPermissions(raw.permissions),
    history: mapHistory(raw.history),
    stages: mapStages(raw.stages),
    items: parsedItems,
    originCountry: raw.originCountry ?? undefined,
    destinationCountry: raw.destinationCountry ?? undefined,
    weightKg: raw.weightKg ?? undefined,
    lengthCm: raw.lengthCm ?? undefined,
    widthCm: raw.widthCm ?? undefined,
    heightCm: raw.heightCm ?? undefined
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

interface CreateOrderInput {
  title: string;
  items?: Array<{ name: string; qty: number; price?: number }>;
  direction: { origin: string; destination: string };
  pricing: QuoteRequest;
  route?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderDetail> {
  const payload = {
    route: input.route,
    items:
      input.items ??
      [
        {
          name: input.title || 'Отправление',
          qty: 1,
          price: input.pricing ? undefined : 0
        }
      ],
    direction: input.direction,
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

export async function createOrderStage(
  id: string,
  payload: { title: string; location?: string; note?: string; happenedAt?: string; warehouseId?: string }
): Promise<OrderStage> {
  const stage = await apiFetch<OrderStage>(`/orders/${id}/stages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return stage;
}

export async function updateOrder(
  id: string,
  payload: Partial<Pick<CreateOrderInput, 'items' | 'direction' | 'pricing'>>
): Promise<OrderDetail> {
  const updated = await apiFetch<BackendOrder>(`/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return mapOrder(updated);
}
