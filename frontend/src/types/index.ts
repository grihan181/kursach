export type OrderStatus = 'created' | 'paid' | 'shipping' | 'delivered' | 'cancelled';

export interface OrderPermission {
  canChangeStatus: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface OrderHistoryEntry {
  id: string;
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
}

export interface OrderStage {
  id: string;
  title: string;
  location?: string | null;
  note?: string | null;
  happenedAt: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
}

export interface OrderSummary {
  id: string;
  reference: string;
  userId: string;
  userEmail?: string;
  status: OrderStatus;
  title: string;
  total: number;
  currency?: string;
  route?: string | null;
  createdAt?: string;
  originCountry?: string | null;
  destinationCountry?: string | null;
  permissions: OrderPermission;
}

export interface OrderDetail extends OrderSummary {
  description?: string;
  createdAt: string;
  history: OrderHistoryEntry[];
  items?: Array<{ name: string; qty: number; price?: number }>;
  weightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  stages?: OrderStage[];
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  countryCode: string;
  countryName: string;
  city: string;
  address: string;
  contactPhone?: string | null;
  workingHours?: string | null;
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
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  phone?: string | null;
}

export interface ProfileUpdatePayload {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  id?: string;
  email?: string;
  role?: string;
  user?: UserProfile | null;
  profile?: UserProfile | null;
}

export type AdminUser = UserProfile;
