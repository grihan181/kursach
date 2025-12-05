'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { OrderSummary } from '@/types';
import { fetchOrders } from '@/services/orders';

export default function OrderList() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchOrders();
      setOrders(data);
      setLoading(false);
    };
    load();
  }, []);

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
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.title}</td>
              <td>
                <span className="badge">{order.status}</span>
              </td>
              <td>{order.total} ₽</td>
              <td>
                <Link className="button secondary" href={`/orders/${order.id}`}>
                  Открыть
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
