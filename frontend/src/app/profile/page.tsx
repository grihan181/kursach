'use client';

import { useEffect, useMemo, useState } from 'react';
import Protected from '@/components/Protected';
import type { ProfileUpdatePayload, UserProfile } from '@/types';
import { fetchProfile, updateProfile } from '@/services/profile';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user, token, setAuth } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(user ?? null);
  const [form, setForm] = useState<ProfileUpdatePayload>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    middleName: user?.middleName ?? '',
    phone: user?.phone ?? ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProfile();
        setProfile(data);
        setForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          middleName: data.middleName ?? '',
          phone: data.phone ?? ''
        });
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayName = useMemo(() => {
    if (!profile) return '—';
    const parts = [profile.lastName, profile.firstName, profile.middleName].filter(Boolean);
    return parts.length ? parts.join(' ') : profile.email;
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile) return '??';
    const first = profile.firstName?.[0] ?? '';
    const last = profile.lastName?.[0] ?? '';
    const fallback = profile.email?.[0] ?? '?';
    return (first + last).trim() || fallback;
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const updated = await updateProfile({
        firstName: form.firstName?.trim() || undefined,
        lastName: form.lastName?.trim() || undefined,
        middleName: form.middleName?.trim() || undefined,
        phone: form.phone?.trim() || undefined
      });
      setProfile(updated);
      setStatus('Профиль обновлён');
      setAuth(updated, token ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Protected>
        <div className="card">Загрузка профиля...</div>
      </Protected>
    );
  }

  return (
    <Protected>
      <div className="grid" style={{ gap: 20 }}>
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <p className="badge" style={{ width: 'fit-content' }}>Профиль пользователя</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 600
              }}
            >
              {initials.toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{displayName}</h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>{profile?.email}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                Роль: <strong>{profile?.role === 'admin' ? 'администратор' : 'пользователь'}</strong>
              </p>
            </div>
          </div>
          <div className="stat-grid">
            <article className="stat-card">
              <p style={{ margin: 0, color: 'var(--muted)' }}>Имя</p>
              <strong>{profile?.firstName ?? '—'}</strong>
            </article>
            <article className="stat-card">
              <p style={{ margin: 0, color: 'var(--muted)' }}>Фамилия</p>
              <strong>{profile?.lastName ?? '—'}</strong>
            </article>
            <article className="stat-card">
              <p style={{ margin: 0, color: 'var(--muted)' }}>Телефон</p>
              <strong>{profile?.phone ?? '—'}</strong>
            </article>
          </div>
        </section>

        <section className="glass" style={{ display: 'grid', gap: 16 }}>
          <h3 style={{ margin: 0 }}>Редактирование</h3>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Эти данные используются в уведомлениях и накладных. Телефон нужен для SMS/звонков при доставке.
          </p>
          <form className="grid" style={{ gap: 16 }} onSubmit={handleSubmit}>
            <div className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <label className="grid">
                Фамилия
                <input
                  className="input"
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </label>
              <label className="grid">
                Имя
                <input
                  className="input"
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </label>
              <label className="grid">
                Отчество
                <input
                  className="input"
                  value={form.middleName}
                  onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
                />
              </label>
              <label className="grid">
                Телефон
                <input
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+7 900 123-45-67"
                />
                <small style={{ color: 'var(--muted)', fontSize: 12 }}>
                  Можно вводить только цифры, пробелы, + и -
                </small>
              </label>
            </div>
            {error && (
              <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{error}</div>
            )}
            {status && (
              <div className="badge" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#bbf7d0' }}>{status}</div>
            )}
            <button className="button secondary" type="submit" disabled={saving}>
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </form>
        </section>
      </div>
    </Protected>
  );
}
