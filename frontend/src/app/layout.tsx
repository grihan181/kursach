import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Order Desk',
  description: 'Order management and chat console'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          <div className="nav-content">
            <Link href="/">Order Desk</Link>
            <div className="nav-links">
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
              <Link href="/orders">Orders</Link>
              <Link href="/chat">Chat</Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
