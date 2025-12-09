'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createOrder } from '@/services/orders';
import { fetchQuote, type QuoteRequest, type QuoteResponse } from '@/services/pricing';

export default function OrderForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [route, setRoute] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteInput, setQuoteInput] = useState<QuoteRequest>({
    weightKg: 1,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    origin: 'US',
    destination: 'RU',
    currency: 'USD'
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder({
        title,
        route,
        pricing: quoteInput,
        items: [
          {
            name: title || 'Товар',
            qty: 1,
            price: quote?.amount
          }
        ]
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const calculateQuote = async () => {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await fetchQuote(quoteInput);
      setQuote(res);
    } catch (err) {
      setQuoteError((err as Error).message);
      setQuote(null);
    } finally {
      setQuoteLoading(false);
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
        Маршрут
        <input className="input" value={route} onChange={(e) => setRoute(e.target.value)} placeholder="US-RU" />
      </label>
      <fieldset className="grid" style={{ gap: 8 }}>
        <legend>Параметры для расчёта цены</legend>
        <div className="grid" style={{ gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <label className="grid">
            Вес, кг
            <input
              className="input"
              type="number"
              min={0.1}
              step="0.1"
              value={quoteInput.weightKg}
              onChange={(e) => setQuoteInput({ ...quoteInput, weightKg: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            Длина, см
            <input
              className="input"
              type="number"
              value={quoteInput.lengthCm}
              onChange={(e) => setQuoteInput({ ...quoteInput, lengthCm: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            Ширина, см
            <input
              className="input"
              type="number"
              value={quoteInput.widthCm}
              onChange={(e) => setQuoteInput({ ...quoteInput, widthCm: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            Высота, см
            <input
              className="input"
              type="number"
              value={quoteInput.heightCm}
              onChange={(e) => setQuoteInput({ ...quoteInput, heightCm: Number(e.target.value) })}
            />
          </label>
          <label className="grid">
            Откуда
            <input
              className="input"
              value={quoteInput.origin}
              onChange={(e) => setQuoteInput({ ...quoteInput, origin: e.target.value })}
            />
          </label>
          <label className="grid">
            Куда
            <input
              className="input"
              value={quoteInput.destination}
              onChange={(e) => setQuoteInput({ ...quoteInput, destination: e.target.value })}
            />
          </label>
        </div>
        <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
          <button className="button secondary" type="button" onClick={calculateQuote} disabled={quoteLoading}>
            {quoteLoading ? 'Расчёт...' : 'Рассчитать стоимость'}
          </button>
          {quote && (
            <span className="badge" style={{ background: '#ecfeff', color: '#0369a1' }}>
              {quote.amount} {quote.currency} {quote.etaDays ? `(${quote.etaDays} дн.)` : ''}
            </span>
          )}
          {quoteError && (
            <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
              {quoteError}
            </span>
          )}
        </div>
      </fieldset>
      {error && <div className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</div>}
      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Создание...' : 'Создать'}
      </button>
    </form>
  );
}
