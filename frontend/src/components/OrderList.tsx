'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { OrderSummary } from '@/types';
import { fetchDashboard } from '@/services/dashboard';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const statusLabels: Record<OrderSummary['status'], string> = {
  created: 'Создан',
  paid: 'Оплачен',
  shipping: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён'
};

const statusOptions: Array<{ value: OrderSummary['status'] | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'created', label: 'Созданные' },
  { value: 'paid', label: 'Оплачено' },
  { value: 'shipping', label: 'В пути' },
  { value: 'delivered', label: 'Доставлено' },
  { value: 'cancelled', label: 'Отменено' }
];

export default function OrderList() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderSummary['status'] | 'all'>('all');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDashboard();
        setOrders(data.orders);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const remove = async (id: string) => {
    const target = orders.find((o) => o.id === id);
    if (!target?.permissions.canDelete) {
      return;
    }
    if (!confirm('Удалить заказ?')) return;
    setBusyId(id);
    try {
      await apiFetch(`/orders/${id}`, { method: 'DELETE' });
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : -Infinity;
      const tb = b.createdAt ? Date.parse(b.createdAt) : -Infinity;
      if (ta === tb) return b.id.localeCompare(a.id);
      return tb - ta;
    });
  }, [orders]);

  const filteredOrders = useMemo(
    () => (statusFilter === 'all' ? sortedOrders : sortedOrders.filter((order) => order.status === statusFilter)),
    [sortedOrders, statusFilter]
  );

  const totals = useMemo(
    () => ({
      all: orders.length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      paid: orders.filter((o) => o.status === 'paid').length
    }),
    [orders]
  );

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const formatTotal = (order: OrderSummary) => `${order.total.toFixed(2)} ${order.currency ?? '₽'}`;

  if (loading) {
    return <div className="card">Загрузка...</div>;
  }

  return (
    <div className="grid" style={{ gap: 20 }}>
      <section className="card" style={{ display: 'grid', gap: 18 }}>
        <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <p className="badge" style={{ marginBottom: 6 }}>Заказы</p>
            <h2 style={{ margin: 0 }}>Список заказов на доставку</h2>
          </div>
          <Link className="button" href="/orders/create">
            Новый заказ
          </Link>
        </div>
        {isAdmin && (
          <>
            <div className="kpi-grid">
              <article className="kpi">
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 12 }}>Всего</p>
                <strong style={{ fontSize: 28 }}>{totals.all}</strong>
              </article>
              <article className="kpi">
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 12 }}>В пути</p>
                <strong style={{ fontSize: 28, color: '#38bdf8' }}>{totals.shipping}</strong>
              </article>
              <article className="kpi">
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 12 }}>Доставлено</p>
                <strong style={{ fontSize: 28, color: '#22c55e' }}>{totals.delivered}</strong>
              </article>
              <article className="kpi">
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 12 }}>Ожидают оплаты</p>
                <strong style={{ fontSize: 28, color: '#facc15' }}>{totals.paid}</strong>
              </article>
            </div>
            <div className="flex" style={{ flexWrap: 'wrap', gap: 10 }}>
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={statusFilter === option.value ? 'button secondary' : 'button ghost'}
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
        {error && (
          <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>
            {error}
          </div>
        )}
      </section>

      <section className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Описание</th>
              {isAdmin && <th>Клиент</th>}
              <th>Статус</th>
              <th>Сумма</th>
              <th>Создан</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'monospace' }}>{order.reference}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong>{order.title}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>{order.route ?? 'Маршрут не указан'}</span>
                  </div>
                </td>
                {isAdmin && (
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{order.userEmail ?? '—'}</span>
                    </div>
                  </td>
                )}
                <td>
                  <span className={`status-chip status-${order.status}`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </td>
                <td>{formatTotal(order)}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <Link className="button secondary" href={`/orders/${order.id}`}>
                      Открыть
                    </Link>
                    {order.permissions.canDelete && (
                      <button className="button ghost" onClick={() => remove(order.id)} disabled={busyId === order.id}>
                        {busyId === order.id ? 'Удаляем...' : 'Удалить'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
