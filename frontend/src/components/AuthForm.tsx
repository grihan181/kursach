'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/services/auth';
import type { AuthPayload, UserProfile } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  mode: 'login' | 'register';
}

const hints = [
  'Доступ к заказам и переписке в одном кабинете',
  'Уведомления о статусах без переключения между сервисами',
];

export default function AuthForm({ mode }: Props) {
  const [form, setForm] = useState<AuthPayload>({
    email: '',
    password: '',
    tokenType: 'bearer',
    firstName: '',
    lastName: '',
    middleName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { setAuth } = useAuth();
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const action = mode === 'login' ? login : register;
      const data = await action(form);
      const fallbackUser: UserProfile | null =
        data.user ??
        (data.profile as UserProfile | undefined) ??
        (data.id && data.email && data.role
          ? {
              id: data.id,
              email: data.email,
              role: data.role
            }
          : null);
      setAuth(fallbackUser, data.accessToken ?? null);
      setSuccess(mode === 'login' ? 'Успешный вход' : 'Регистрация завершена');
      router.push('/orders');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? 'Добро пожаловать обратно' : 'Создайте рабочую учётную запись';
  const subtitle =
    mode === 'login'
      ? 'Введите почту и пароль, чтобы открыть панель мониторинга.'
      : 'Регистрация нужна один раз: дальше всё управление доступно из одного окна.';

  return (
    <section className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
      <form onSubmit={submit} className="grid" style={{ gap: 18 }}>
        <header className="grid" style={{ gap: 6 }}>
          <p className="badge" style={{ width: 'fit-content' }}>
            Доступ к панели
          </p>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>{subtitle}</p>
        </header>
        <label className="grid">
          Электронная почта
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="user@company.ru"
            required
          />
        </label>
        <label className="grid">
          Пароль
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="********"
            required
          />
        </label>
        {mode === 'register' && (
          <div className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label className="grid">
              Фамилия
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Иванов"
                required
              />
            </label>
            <label className="grid">
              Имя
              <input
                className="input"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Иван"
                required
              />
            </label>
            <label className="grid">
              Отчество
              <input
                className="input"
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                placeholder="Иванович"
              />
            </label>
            <label className="grid">
              Телефон для уведомлений
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+7 900 123-45-67"
              />
            </label>
          </div>
        )}
        <div className="flex" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" className="button" disabled={loading}>
            {loading ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>
          <p style={{ fontSize: 14 }}>
            {mode === 'login' ? 'Нет доступа?' : 'Уже есть профиль?'}{' '}
            <Link href={mode === 'login' ? '/register' : '/login'}>
              {mode === 'login' ? 'Зарегистрируйтесь' : 'Войдите'}
            </Link>
          </p>
        </div>
        {error && (
          <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#bbf7d0' }}>
            {success}
          </div>
        )}
      </form>

      <aside className="glass" style={{ alignSelf: 'stretch' }}>
        <h3 style={{ marginTop: 0 }}>Что вы получите</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {hints.map((hint) => (
            <li key={hint} style={{ display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--accent)' }}>{'->'}</span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
            После успешного входа вы попадёте в раздел «Заказы», где можно создавать заявки, менять статусы и вести чат.
          </p>
      </aside>
    </section>
  );
}


