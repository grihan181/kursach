'use client';

import { useEffect, useState } from 'react';
import type { AdminUser } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { deleteAdminUser, fetchAdminUsers, updateAdminUserRole } from '@/services/admin';

export default function UserAdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchAdminUsers();
        setUsers(list);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRoleChange = async (id: string, role: 'user' | 'admin') => {
    setBusyId(id);
    setError(null);
    try {
      const updated = await updateAdminUserRole(id, role);
      setUsers((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (id: string) => {
    if (user?.id === id) {
      setError('Нельзя удалить собственную учётную запись');
      return;
    }
    if (!confirm('Удалить пользователя?')) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteAdminUser(id);
      setUsers((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="card">Загрузка списка пользователей...</div>;
  }

  return (
    <section className="card" style={{ display: 'grid', gap: 20 }}>
      <header>
        <p className="badge" style={{ marginBottom: 6 }}>Администрирование</p>
        <h2 style={{ margin: 0 }}>Пользователи</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>Выдавайте права администратора или удаляйте учётные записи.</p>
      </header>
      {error && (
        <div className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fecaca' }}>{error}</div>
      )}
      <div className="table-shell">
        <table className="table">
          <thead>
            <tr>
              <th>Почта</th>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td>{item.email}</td>
                <td>{formatName(item)}</td>
                <td>{item.phone ?? '—'}</td>
                <td>
                  <select
                    className="input"
                    value={item.role}
                    onChange={(e) => handleRoleChange(item.id, e.target.value as 'user' | 'admin')}
                    disabled={busyId === item.id}
                  >
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                  </select>
                </td>
                <td>
                  <button
                    className="button ghost"
                    onClick={() => removeUser(item.id)}
                    disabled={busyId === item.id}
                  >
                    {busyId === item.id ? 'Удаляем...' : 'Удалить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && <p style={{ margin: 0, color: 'var(--muted)' }}>Пока нет зарегистрированных пользователей.</p>}
    </section>
  );
}

function formatName(user: AdminUser): string {
  const parts = [user.lastName, user.firstName, user.middleName].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}
