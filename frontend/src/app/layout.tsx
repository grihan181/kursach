import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Панель международной доставки',
  description: 'Единая витрина для авторизации, заказов, статусов и уведомлений по доставке'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="app-shell">
        <Providers>
          <NavBar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
