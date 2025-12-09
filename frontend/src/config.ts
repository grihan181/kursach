const browserOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;

export const bffBaseUrl =
  process.env.NEXT_PUBLIC_BFF_URL || (browserOrigin ? `${browserOrigin}/api` : 'http://localhost:3000/api');

export const chatSocketBaseUrl =
  process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || browserOrigin || 'http://localhost:3000';
export const tokenStorageKey = 'orderdesk_token';
export const refreshTokenStorageKey = 'orderdesk_refresh';
