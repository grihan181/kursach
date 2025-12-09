import { io, Socket } from 'socket.io-client';
import type { Message } from '@/types';
import { apiFetch } from './api';
import { chatSocketBaseUrl, tokenStorageKey } from '@/config';

interface ChatSocketHandlers {
  onMessage: (message: Message) => void;
  onHistory?: (messages: Message[]) => void;
  onStatus?: (status: 'connecting' | 'open' | 'closed') => void;
}

export async function fetchMessages(orderId: string): Promise<Message[]> {
  return apiFetch<Message[]>(`/chat/${orderId}/messages`);
}

export interface ConversationSummary {
  orderId: string;
  lastMessageAt: string | null;
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  return apiFetch<ConversationSummary[]>('/chat');
}

export function connectToChat(orderId: string, handlers: ChatSocketHandlers): Socket {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem(tokenStorageKey) ?? undefined : undefined;

  const socket = io(`${chatSocketBaseUrl}/chat`, {
    path: '/api/chat/socket.io',
    transports: ['websocket'],
    query: { orderId, token }
  });

  handlers.onStatus?.('connecting');

  socket.on('connect', () => handlers.onStatus?.('open'));
  socket.on('disconnect', () => handlers.onStatus?.('closed'));
  socket.on('connect_error', () => handlers.onStatus?.('closed'));

  socket.emit('join', { orderId });
  socket.on('history', (messages: Message[]) => handlers.onHistory?.(messages));
  socket.on('message', (message: Message) => handlers.onMessage(message));

  return socket;
}
