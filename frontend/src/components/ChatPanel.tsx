'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { buildHistoryMock, connectToChat } from '@/services/chat';
import type { Message } from '@/types';

export default function ChatPanel() {
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'open' | 'closed'>('connecting');
  const [messages, setMessages] = useState<Message[]>(buildHistoryMock());
  const [input, setInput] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = connectToChat((message) => setMessages((prev) => [...prev, message]));
    socketRef.current = socket;
    socket.addEventListener('open', () => setSocketStatus('open'));
    socket.addEventListener('close', () => setSocketStatus('closed'));
    socket.addEventListener('error', () => setSocketStatus('closed'));

    return () => socket.close();
  }, []);

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;

    const message: Message = {
      id: `local-${Date.now()}`,
      author: 'you',
      content: input,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, message]);
    setInput('');

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  };

  return (
    <div className="card chat-panel">
      <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Чат</h2>
        <span className="badge">WebSocket: {socketStatus}</span>
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <article key={msg.id} className="message">
            <strong>{msg.author}</strong>
            <p>{msg.content}</p>
            <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
          </article>
        ))}
      </div>
      <form className="flex" onSubmit={send}>
        <input
          className="input"
          placeholder="Введите сообщение"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="button" type="submit">
          Отправить
        </button>
      </form>
    </div>
  );
}
