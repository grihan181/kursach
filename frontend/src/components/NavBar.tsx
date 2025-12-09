'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function NavBar() {
  const { user, handleLogout, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    handleLogout();
    router.push('/login');
  };

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className="nav">
      <div className="nav-content">
        <Link href="/" className="brand">
          Delivery Desk
        </Link>
        <div className="nav-links">
          <Link className={isActive('/orders') ? 'active' : ''} href="/orders">
            Заказы
          </Link>
          <Link className={isActive('/chat') ? 'active' : ''} href="/chat">
            Чат
          </Link>
          {!loading && user ? (
            <>
              <span className="badge"> {user.email ?? 'Профиль'} </span>
              <button className="button ghost" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Войти</Link>
              <Link href="/register" className="pill">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
