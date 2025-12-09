'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/services/auth';
import type { AuthPayload } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: Props) {
  const [form, setForm] = useState<AuthPayload>({ email: '', password: '', tokenType: 'bearer' });
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
      setAuth(data.user ?? { id: data.id, email: data.email, role: data.role }, data.accessToken ?? null);
      setSuccess(mode === 'login' ? 'Успешный вход' : 'Регистрация завершена');
      router.push('/orders');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid" style={{ gap: 16 }}>
      <label className="grid">
        Email
        <input
          className="input"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          required
        />
      </label>
      <div className="flex" style={{ gap: 8, alignItems: 'center' }}>
        <button type="submit" className="button" disabled={loading} style={{ flex: '0 0 auto' }}>
          {loading ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
        </button>
        <p style={{ fontSize: 14 }}>
          {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <Link href={mode === 'login' ? '/register' : '/login'} className="link">
            {mode === 'login' ? 'Регистрация' : 'Войти'}
          </Link>
        </p>
      </div>
      {error && (
        <div className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="badge" style={{ background: '#ecfdf3', color: '#166534' }}>
          {success}
        </div>
      )}
    </form>
  );
}
