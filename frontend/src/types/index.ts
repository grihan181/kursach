export type OrderStatus = 'draft' | 'paid' | 'shipping' | 'delivered' | 'cancelled';

export interface OrderPermission {
  canChangeStatus: boolean;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  title: string;
  total: number;
  currency?: string;
  route?: string | null;
  createdAt?: string;
}

export interface OrderDetail extends OrderSummary {
  description?: string;
  createdAt: string;
  permissions: OrderPermission;
  history: OrderStatus[];
  items?: Array<{ name: string; qty: number; price?: number }>;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export interface AuthPayload {
  email: string;
  password: string;
  tokenType?: 'cookie' | 'bearer';
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  id?: string;
  email?: string;
  role?: string;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
}
