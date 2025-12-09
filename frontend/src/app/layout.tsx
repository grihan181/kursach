import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Delivery Desk',
  description: 'Микросервисная доставка: заказы, чат, уведомления'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-shell">
        <Providers>
          <NavBar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
