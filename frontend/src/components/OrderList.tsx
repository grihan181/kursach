'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderSummary } from '@/types';
import { fetchDashboard } from '@/services/dashboard';
import { apiFetch } from '@/services/api';

const statusLabels: Record<OrderSummary['status'], string> = {
  draft: 'Черновик',
  paid: 'Оплачен',
  shipping: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён'
};

export default function OrderList() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
    const confirmed = confirm('Удалить заказ?');
    if (!confirmed) return;
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

  const sortedOrders = [...orders].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : -Infinity;
    const tb = b.createdAt ? Date.parse(b.createdAt) : -Infinity;
    if (ta === tb) return b.id.localeCompare(a.id);
    return tb - ta;
  });

  if (loading) {
    return <div className="card">Загрузка...</div>;
  }

  return (
    <div className="card">
      <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Список заказов</h2>
        <Link className="button" href="/orders/create">
          Новый заказ
        </Link>
      </div>
      {error && (
        <div className="badge" style={{ background: '#fee2e2', color: '#991b1b', marginTop: 8 }}>
          {error}
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Статус</th>
            <th>Сумма</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.title}</td>
              <td>
                <span className={`badge status-${order.status}`}>
                  {statusLabels[order.status] ?? order.status}
                </span>
              </td>
              <td>
                {order.total} {order.currency ?? '₽'}
              </td>
              <td>
                <div className="flex" style={{ gap: 8 }}>
                  <Link className="button secondary" href={`/orders/${order.id}`}>
                    Открыть
                  </Link>
                  <button
                    className="button danger"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }}
                    onClick={() => remove(order.id)}
                    disabled={busyId === order.id}
                  >
                    {busyId === order.id ? 'Удаляем...' : 'Удалить'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
