export type OrderStatus = 'new' | 'processing' | 'shipped' | 'done' | 'canceled';

export interface OrderPermission {
  canChangeStatus: boolean;
}

export interface OrderSummary {
  id: string;
  title: string;
  status: OrderStatus;
  total: number;
}

export interface OrderDetail extends OrderSummary {
  description: string;
  createdAt: string;
  permissions: OrderPermission;
  history: OrderStatus[];
}

export interface Message {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface AuthPayload {
  email: string;
  password: string;
  tokenType?: 'cookie' | 'bearer';
}

export interface AuthResponse {
  token?: string;
  user: {
    id: string;
    email: string;
  };
}
