'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createOrder } from '@/services/orders';
import type { OrderStatus } from '@/types';

const statuses: OrderStatus[] = ['new', 'processing', 'shipped', 'done', 'canceled'];

export default function OrderForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [total, setTotal] = useState<number>(0);
  const [status, setStatus] = useState<OrderStatus>('new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder({ title, description, total, status });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card grid" style={{ gap: 12 }} onSubmit={submit}>
      <h2>Создать заказ</h2>
      <label className="grid">
        Название
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="grid">
        Описание
        <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>
      <label className="grid">
        Сумма, ₽
        <input
          className="input"
          type="number"
          value={total}
          min={0}
          onChange={(e) => setTotal(Number(e.target.value))}
        />
      </label>
      <label className="grid">
        Статус
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      {error && <div className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</div>}
      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Создание...' : 'Создать'}
      </button>
    </form>
  );
}
