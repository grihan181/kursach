'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { connectToChat, fetchMessages, fetchConversations } from '@/services/chat';
import { fetchOrders } from '@/services/orders';
import { useAuth } from '@/hooks/useAuth';
import type { Message, OrderSummary } from '@/types';
import type { ConversationSummary } from '@/services/chat';

export default function ChatPanel() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'open' | 'closed'>('closed');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof connectToChat> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const initialSelected = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [orderList, convoList] = await Promise.all([fetchOrders(), fetchConversations()]);
        const adminRoom =
          user?.email === 'admin@admin'
            ? [{ id: 'admin-feed', title: 'Системные сообщения', status: 'draft', total: 0 }]
            : [];

        const timeById: Record<string, string | null> = {};
        convoList.forEach((c) => {
          timeById[c.orderId] = c.lastMessageAt;
        });

        const combined = [...orderList, ...adminRoom].map((o) => ({
          summary: o,
          lastMessageAt: timeById[o.id] ?? null
        }));

        combined.sort((a, b) => {
          const ta = a.lastMessageAt ? Date.parse(a.lastMessageAt) : -Infinity;
          const tb = b.lastMessageAt ? Date.parse(b.lastMessageAt) : -Infinity;
          if (ta === tb) return 0;
          return tb - ta;
        });

        const sorted = combined.map((c) => c.summary as OrderSummary);
        setOrders(sorted);
        if (!initialSelected.current && sorted.length > 0) {
          setOrderId(sorted[0].id);
          initialSelected.current = true;
        }
      } catch {
        setError('Не удалось загрузить список чатов');
      }
    };

    load();
  }, [user?.email]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setError(null);
    setSocketStatus('connecting');

    const loadHistory = async () => {
      try {
        const history = await fetchMessages(orderId);
        if (!cancelled) {
          setMessages(history);
        }
      } catch (error) {
        console.warn('Не удалось загрузить историю чата', error);
        setError('Не удалось загрузить историю для этой комнаты');
      }
    };

    loadHistory();

    const socket = connectToChat(orderId, {
      onStatus: setSocketStatus,
      onHistory: (history) => {
        setMessages(history);
      },
      onMessage: (message) =>
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        })
    });

    socketRef.current = socket;

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || !orderId) return;

    const sender = user?.email ?? user?.id ?? 'user';
    setInput('');

    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', { orderId, sender, content: input });
    }
  };

  return (
    <div className="grid chat-grid">
      <aside className="card chat-sidebar">
        <h3>Чаты заказов</h3>
        {orders.length === 0 && <p className="muted">Нет заказов</p>}
        <div className="chat-list">
          {orders.map((o) => (
            <button
              key={o.id}
              className={`chat-list-item ${orderId === o.id ? 'active' : ''}`}
              onClick={() => setOrderId(o.id)}
            >
              <div className="chat-list-title">{o.title || o.id}</div>
              <div className="chat-list-sub">{o.status}</div>
            </button>
          ))}
        </div>
      </aside>
      <div className="card chat-panel">
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2>Чат</h2>
            <small className="muted">Комната: {orderId ?? 'не выбрана'}</small>
          </div>
          <span className="badge">WebSocket: {socketStatus}</span>
        </div>
        {error && (
          <div className="badge" style={{ background: '#fee2e2', color: '#991b1b', marginBottom: '0.5rem' }}>
            {error}
          </div>
        )}
        <div className="chat-messages">
        {messages.map((msg) => (
            <article
              key={msg.id}
              className={`message ${user && (msg.sender === user.email || msg.sender === user.id) ? 'me' : 'other'}`}
            >
              {!(user && (msg.sender === user.email || msg.sender === user.id)) && (
                <div className="message-sender">{msg.sender || 'пользователь'}</div>
              )}
              <p>{msg.content}</p>
              <small>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </small>
            </article>
          ))}
          {messages.length === 0 && <p className="muted">Нет сообщений</p>}
          <div ref={bottomRef} />
        </div>
        <form className="flex" onSubmit={send}>
          <input
            className="input"
            placeholder={orderId ? 'Введите сообщение' : 'Сначала выберите заказ'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!orderId}
          />
          <button className="button" type="submit" disabled={!orderId}>
            Отправить
          </button>
        </form>
      </div>
    </div>
  );
}
