'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function NavBar() {
  const { user, handleLogout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.role === 'admin';
  const displayName = useMemo(() => {
    if (!user) return 'Профиль';
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length) return parts.join(' ');
    return user.email ?? 'Профиль';
  }, [user]);

  const logout = () => {
    handleLogout();
    router.push('/login');
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="nav">
      <div className="nav-content">
        <Link href="/" className="brand" aria-label="Главная страница">
          <span>delivery-test</span>
          <small style={{ display: 'block', fontSize: 12, textTransform: 'none', color: 'var(--muted)' }}>
            международная доставка
          </small>
        </Link>
        <div className="nav-links">
          <Link className={isActive('/') ? 'active' : ''} href="/">
            Главная
          </Link>
          <Link className={isActive('/orders') ? 'active' : ''} href="/orders">
            Заказы
          </Link>
          <Link className={isActive('/warehouses') ? 'active' : ''} href="/warehouses">
            Наши склады
          </Link>
          <Link className={isActive('/chat') ? 'active' : ''} href="/chat">
            Поддержка
          </Link>
          <Link className={isActive('/profile') ? 'active' : ''} href="/profile">
            Профиль
          </Link>
          <Link className={isActive('/orders/create') ? 'active' : ''} href="/orders/create">
            Новый заказ
          </Link>
          {isAdmin && (
            <Link className={isActive('/admin') ? 'active' : ''} href="/admin/users">
              Управление пользователями
            </Link>
          )}
          {!loading && user ? (
            <>
              <span className="badge" title={user.email ?? ''}>
                {displayName} {isAdmin ? '· админ' : ''}
              </span>
              <button className="button secondary" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={isActive('/login') ? 'active' : ''}>
                Войти
              </Link>
              <Link href="/register">
                Зарегистрироваться
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
