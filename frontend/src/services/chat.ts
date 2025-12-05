import type { Message } from '@/types';
import { wsBaseUrl } from '@/config';

export function connectToChat(onMessage: (message: Message) => void): WebSocket {
  const socket = new WebSocket(wsBaseUrl);

  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data) as Message;
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse message', error);
    }
  });

  return socket;
}

export function buildHistoryMock(): Message[] {
  const now = Date.now();
  return [
    {
      id: 'msg-1',
      author: 'support@desk.io',
      content: 'Добро пожаловать в чат! Задайте вопрос, мы рядом.',
      createdAt: new Date(now - 1000 * 60 * 3).toISOString()
    },
    {
      id: 'msg-2',
      author: 'operator@desk.io',
      content: 'Могу помочь с изменением статуса заказа?',
      createdAt: new Date(now - 1000 * 60 * 2).toISOString()
    }
  ];
}
