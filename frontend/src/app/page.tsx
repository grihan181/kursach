'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

const highlights = [
  { label: 'Активные заказы', value: '128', tone: 'var(--accent)' },
  { label: 'На доставке', value: '46', tone: '#38bdf8' },
  { label: 'Диалогов в очереди', value: '9', tone: '#f472b6' }
];

export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="container">
      <section className="hero">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <p className="badge" style={{ alignSelf: 'flex-start' }}>
            Сервис международной доставки
          </p>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1 }}>Добро пожаловать!</h1>
          <p style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            Планируйте маршрут, рассчитывайте тарифы и отслеживайте статусы отправлений в едином рабочем кабинете. Все ключевые шаги по
            доставке собраны на одной панели, независимо от устройства.
          </p>
          <div className="flex" style={{ flexWrap: 'wrap' }}>
            <Link className="button" href="/orders">
              Перейти к заказам
            </Link>
            <Link className="button ghost" href={user ? '/orders/create' : '/login'}>
              {user ? 'Создать заказ' : 'Войти'}
            </Link>
            {isAdmin && (
              <Link className="button secondary" href="/chat">
                Центр сообщений
              </Link>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="glass" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ margin: 0 }}>Сводка текущих заказов</h3>
            <div className="kpi-grid">
              {highlights.map((item) => (
                <article key={item.label} className="kpi">
                  <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)' }}>{item.label}</p>
                  <strong style={{ fontSize: 26, color: item.tone }}>{item.value}</strong>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}


