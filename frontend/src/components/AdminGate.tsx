'use client';

import { useAuth } from '@/hooks/useAuth';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container">
        <div className="card">Загрузка...</div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container">
        <div className="card">Нет доступа к этому разделу.</div>
      </div>
    );
  }

  return <>{children}</>;
}
