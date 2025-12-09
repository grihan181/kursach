export type Role = 'user' | 'admin';

export interface AppConfig {
  port: number;
  apiPrefix: string;
  authServiceUrl: string;
  ordersServiceUrl: string;
  chatServiceUrl: string;
  pricingServiceUrl: string;
  notificationsServiceUrl: string;
  jwtSecret: string;
  httpTimeoutMs: number;
  httpRetryCount: number;
  corsOrigins: string[];
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? '/api',
    authServiceUrl: requireEnv('AUTH_SERVICE_URL'),
    ordersServiceUrl: requireEnv('ORDERS_SERVICE_URL'),
    chatServiceUrl: requireEnv('CHAT_SERVICE_URL'),
    pricingServiceUrl: requireEnv('PRICING_SERVICE_URL'),
    notificationsServiceUrl: requireEnv('NOTIFICATIONS_SERVICE_URL'),
    jwtSecret: requireEnv('JWT_SECRET'),
    httpTimeoutMs: Number(process.env.HTTP_TIMEOUT_MS ?? 5000),
    httpRetryCount: Number(process.env.HTTP_RETRY_COUNT ?? 2),
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost,http://localhost:3000').split(',').map((s) => s.trim())
  };
}
