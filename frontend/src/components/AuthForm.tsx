'use client';

import { useState } from 'react';
import { login, register } from '@/services/auth';
import type { AuthPayload } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: Props) {
  const [form, setForm] = useState<AuthPayload>({ email: '', password: '', tokenType: 'cookie' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setToken } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const action = mode === 'login' ? login : register;
      const data = await action(form);
      setUser(data.user);
      if (data.token) {
        setToken(data.token);
      }
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
      <label className="grid">
        Тип токена
        <select
          className="input"
          value={form.tokenType ?? 'cookie'}
          onChange={(e) => setForm({ ...form, tokenType: e.target.value as AuthPayload['tokenType'] })}
        >
          <option value="cookie">HTTP-only cookie</option>
          <option value="bearer">Bearer header</option>
        </select>
      </label>
      {error && <div className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</div>}
      <button type="submit" className="button" disabled={loading}>
        {loading ? 'Отправка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
      </button>
    </form>
  );
}
