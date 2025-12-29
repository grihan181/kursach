'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { connectToChat, fetchMessages, fetchConversations } from '@/services/chat';
import { fetchOrders } from '@/services/orders';
import { fetchDashboard } from '@/services/dashboard';
import { useAuth } from '@/hooks/useAuth';
import type { Message, OrderSummary, OrderStatus } from '@/types';
import { fetchAdminUsers } from '@/services/admin';

const socketLabel = {
  connecting: 'подключаемся',
  open: 'в сети',
  closed: 'отключено'
};

const statusBadge: Record<OrderStatus, string> = {
  created: 'Создан',
  paid: 'Оплачен',
  shipping: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён'
};

type ChatPanelProps = {
  initialOrderId?: string | null;
};

export default function ChatPanel({ initialOrderId }: ChatPanelProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'open' | 'closed'>('closed');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const socketRef = useRef<ReturnType<typeof connectToChat> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const initialSelected = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        let orderList: OrderSummary[] = [];
        try {
          orderList = await fetchOrders();
        } catch {
          const dashboard = await fetchDashboard();
          orderList = dashboard.orders;
        }
        const convoList = await fetchConversations();
        const timeById = new Map(convoList.map((c) => [c.orderId, c.lastMessageAt]));
        const ordered = [...orderList].sort((a, b) => {
          const taRaw = timeById.get(a.id);
          const tbRaw = timeById.get(b.id);
          const ta = taRaw ? Date.parse(taRaw) : -Infinity;
          const tb = tbRaw ? Date.parse(tbRaw) : -Infinity;
          if (ta === tb) {
            const ca = a.createdAt ? Date.parse(a.createdAt) : 0;
            const cb = b.createdAt ? Date.parse(b.createdAt) : 0;
            return cb - ca;
          }
          return tb - ta;
        });
        setOrders(ordered);
        if (!initialSelected.current && ordered.length > 0) {
          const preferred =
            initialOrderId && ordered.some((o) => o.id === initialOrderId) ? initialOrderId : ordered[0].id;
          setOrderId(preferred);
          initialSelected.current = true;
        }
      } catch {
        setError('Не удалось загрузить список чатов');
        setOrders([]);
      }
    };

    load();
  }, [user?.email, initialOrderId]);

  useEffect(() => {
    let cancelled = false;
    const seed: Record<string, string> = user?.id && user?.email ? { [user.id]: user.email } : {};
    setUserEmails(seed);
    if (user?.role === 'admin') {
      fetchAdminUsers()
        .then((users) => {
          if (cancelled) return;
          const map = users.reduce<Record<string, string>>((acc, item) => {
            acc[item.id] = item.email;
            return acc;
          }, { ...seed });
          setUserEmails(map);
        })
        .catch(() => {
          /* ignore */
        });
    }
    return () => {
      cancelled = true;
    };
  }, [user?.role, user?.id, user?.email]);

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
      onHistory: (history) => setMessages(history),
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

    const sender = user?.email ?? user?.id ?? 'пользователь';
    const payload = { orderId, sender, content: input };
    setInput('');

    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', payload);
    }
  };

  useEffect(() => {
    if (initialOrderId && orders.some((o) => o.id === initialOrderId)) {
      setOrderId(initialOrderId);
    }
  }, [initialOrderId, orders]);

  const resolveEmail = (userId?: string | null) => {
    if (!userId) return undefined;
    if (userEmails[userId]) {
      return userEmails[userId];
    }
    if (user?.id === userId) {
      return user?.email ?? userId;
    }
    return undefined;
  };

  const selectedOrder = orderId ? orders.find((o) => o.id === orderId) : null;

  return (
    <div className="chat-shell">
      <aside className="chat-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Все комнаты</h3>
          <span className="badge" style={{ fontSize: 11 }}>{orders.length} шт.</span>
        </div>
        {orders.length === 0 && <p style={{ color: 'var(--muted)' }}>Нет активных заказов</p>}
        <div className="chat-list">
          {orders.map((o) => (
            <button key={o.id} className={`chat-list-item ${orderId === o.id ? 'active' : ''}`} onClick={() => setOrderId(o.id)}>
              <div className="chat-list-title">
                {(o.reference ?? o.id)} · {o.title || 'Без названия'}
              </div>
              <div className="chat-list-sub">
                {(o.userEmail ?? resolveEmail(o.userId) ?? 'почта не указана') + ' · ' + (statusBadge[o.status] ?? statusBadge.created)}
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="chat-panel">
        <div className="flex" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p className="badge">Комната: {selectedOrder?.reference ?? 'не выбрана'}</p>
            <h2 style={{ margin: '4px 0' }}>Чат с клиентом</h2>
          </div>
          <span className="badge">Состояние: {socketLabel[socketStatus]}</span>
        </div>
        {error && (
          <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{error}</div>
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
              <small>{new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</small>
            </article>
          ))}
          {messages.length === 0 && <p style={{ color: 'var(--muted)' }}>Сообщений ещё нет</p>}
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
