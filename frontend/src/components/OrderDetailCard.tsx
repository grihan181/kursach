'use client';

import { useEffect, useState } from 'react';
import type { OrderDetail, OrderStatus } from '@/types';
import { fetchOrderDetail, updateOrderStatus } from '@/services/orders';

const statuses: OrderStatus[] = ['new', 'processing', 'shipped', 'done', 'canceled'];

interface Props {
  id: string;
}

export default function OrderDetailCard({ id }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOrderDetail(id);
        setOrder(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, [id]);

  const onChangeStatus = async (status: OrderStatus) => {
    if (!order) return;
    setPending(true);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrder({ ...updated });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  if (!order) {
    return <div className="card">{error ?? 'Загрузка...'}</div>;
  }

  return (
    <div className="card grid" style={{ gap: 16 }}>
      <div className="flex" style={{ justifyContent: 'space-between' }}>
        <div>
          <p className="badge">{order.status}</p>
          <h2>{order.title}</h2>
          <p>{order.description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <strong>{order.total} ₽</strong>
          <p style={{ color: '#475569' }}>Создан: {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <section>
        <h3>Статус</h3>
        <div className="status-control">
          <select
            className="input"
            value={order.status}
            onChange={(e) => onChangeStatus(e.target.value as OrderStatus)}
            disabled={!order.permissions.canChangeStatus || pending}
          >
            {statuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
          {!order.permissions.canChangeStatus && <span className="badge">Недоступно для роли</span>}
        </div>
      </section>

      <section>
        <h3>История статусов</h3>
        <div className="flex">
          {order.history.map((entry, index) => (
            <span className="badge" key={`${entry}-${index}`}>
              {entry}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
