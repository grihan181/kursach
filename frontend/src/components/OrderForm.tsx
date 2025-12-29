'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createOrder } from '@/services/orders';
import { fetchQuote, type QuoteRequest, type QuoteResponse } from '@/services/pricing';
import { COUNTRY_OPTIONS } from '@/constants/countries';

const LIMITS = {
  weight: { min: 0.1, max: 500 },
  dimension: { min: 1, max: 300 }
} as const;

export default function OrderForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
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

  const originOption = COUNTRY_OPTIONS.find((c) => c.code === quoteInput.origin) ?? COUNTRY_OPTIONS[1];
  const destinationOption =
    COUNTRY_OPTIONS.find((c) => c.code === quoteInput.destination) ?? COUNTRY_OPTIONS[0];
  const computedRoute = `${originOption.label} -> ${destinationOption.label}`;
  const sameCountry = quoteInput.origin === quoteInput.destination;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sameCountry) {
      setError('Выберите разные страны отправления и назначения');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder({
        title,
        route: computedRoute,
        direction: { origin: quoteInput.origin, destination: quoteInput.destination },
        pricing: quoteInput,
        items: [
          {
            name: title || 'Груз',
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
    if (sameCountry) {
      setQuote(null);
      setQuoteError('Выберите разные страны для маршрута');
      return;
    }
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

  const updateCountry = (type: 'origin' | 'destination', code: string) => {
    setQuoteInput((prev) => ({ ...prev, [type]: code }));
  };

  const canSubmit = !sameCountry && !loading;

  return (
    <section
      className="card"
      style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}
    >
      <form className="grid" style={{ gap: 18 }} onSubmit={submit}>
        <header className="grid" style={{ gap: 6 }}>
          <p className="badge" style={{ width: 'fit-content' }}>Новый заказ</p>
          <h2 style={{ margin: 0 }}>Описание груза</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Заполните параметры груза, а стоимость и сроки рассчитаем автоматически.
          </p>
        </header>
        <label className="grid">
          Название отправления
          <input
            className="input"
            value={title}
            minLength={3}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Электроника"
            required
          />
        </label>
        <section className="grid" style={{ gap: 12 }}>
          <h3 style={{ margin: '16px 0 0' }}>Направление</h3>
          <div className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label className="grid">
              Откуда
              <select className="input" value={quoteInput.origin} onChange={(e) => updateCountry('origin', e.target.value)}>
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid">
              Куда
              <select
                className="input"
                value={quoteInput.destination}
                onChange={(e) => updateCountry('destination', e.target.value)}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="badge" style={{ width: 'fit-content' }}>Маршрут: {computedRoute}</div>
          {sameCountry && (
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>
              Выберите разные страны отправления и назначения
            </span>
          )}
        </section>
        <section className="grid" style={{ gap: 10 }}>
          <h3 style={{ margin: '16px 0 0' }}>Параметры для расчёта</h3>
          <div className="grid" style={{ gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <label className="grid">
              Вес, кг
              <input
                className="input"
                type="number"
                min={LIMITS.weight.min}
                max={LIMITS.weight.max}
                step="0.1"
                value={quoteInput.weightKg}
                onChange={(e) =>
                  setQuoteInput({
                    ...quoteInput,
                    weightKg: clamp(Number(e.target.value), LIMITS.weight.min, LIMITS.weight.max)
                  })
                }
              />
            </label>
            <label className="grid">
              Длина, см
              <input
                className="input"
                type="number"
                min={LIMITS.dimension.min}
                max={LIMITS.dimension.max}
                step="1"
                value={quoteInput.lengthCm}
                onChange={(e) =>
                  setQuoteInput({
                    ...quoteInput,
                    lengthCm: clamp(Number(e.target.value), LIMITS.dimension.min, LIMITS.dimension.max)
                  })
                }
              />
            </label>
            <label className="grid">
              Ширина, см
              <input
                className="input"
                type="number"
                min={LIMITS.dimension.min}
                max={LIMITS.dimension.max}
                step="1"
                value={quoteInput.widthCm}
                onChange={(e) =>
                  setQuoteInput({
                    ...quoteInput,
                    widthCm: clamp(Number(e.target.value), LIMITS.dimension.min, LIMITS.dimension.max)
                  })
                }
              />
            </label>
            <label className="grid">
              Высота, см
              <input
                className="input"
                type="number"
                min={LIMITS.dimension.min}
                max={LIMITS.dimension.max}
                step="1"
                value={quoteInput.heightCm}
                onChange={(e) =>
                  setQuoteInput({
                    ...quoteInput,
                    heightCm: clamp(Number(e.target.value), LIMITS.dimension.min, LIMITS.dimension.max)
                  })
                }
              />
            </label>
          </div>
          <div className="flex" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="button secondary" type="button" onClick={calculateQuote} disabled={quoteLoading}>
              {quoteLoading ? 'Расчёт...' : 'Рассчитать стоимость'}
            </button>
            {quote && (
              <span className="badge" style={{ background: 'rgba(14, 165, 233, 0.18)', color: '#bae6fd' }}>
                {quote.amount.toFixed(2)} {quote.currency} {quote.etaDays ? `· ${quote.etaDays} дн.` : ''}
              </span>
            )}
            {quoteError && (
              <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{quoteError}</span>
            )}
          </div>
        </section>
        {error && (
          <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{error}</div>
        )}
        <button className="button" type="submit" disabled={!canSubmit}>
          {loading ? 'Создаём...' : 'Создать заказ'}
        </button>
      </form>

      <aside className="glass" style={{ alignSelf: 'stretch', display: 'grid', gap: 16 }}>
        <h3 style={{ margin: 0 }}>Контрольный список</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          <li>- Укажите понятное описание груза и маршрут.</li>
          <li>- Проверьте габариты и вес перед отправкой формы.</li>
          <li>- После отправки форма мгновенно добавится в список заказов.</li>
        </ul>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Что будет дальше:</p>
          <ul style={{ margin: 8, paddingLeft: 18 }}>
            <li>карточка появится в разделе «Заказы»;</li>
            <li>оператор получит уведомление о создании заявки;</li>
            <li>оператор сможет обновить статус в один клик.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}






