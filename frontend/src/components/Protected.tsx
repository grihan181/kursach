 'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Protected({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      window.location.href = '/register';
    } else {
      setReady(true);
    }
  }, [loading, token]);

  if (!ready) {
    return (
      <div className="container">
        <div className="card">Загрузка...</div>
      </div>
    );
  }

  return <>{children}</>;
}
