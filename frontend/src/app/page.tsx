import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container">
      <div className="card">
        <h1>Order Desk</h1>
        <p>Фронтенд Next.js с потоками авторизации через BFF, заказами и чатом.</p>
        <div className="flex">
          <Link className="button" href="/orders">
            Перейти к заказам
          </Link>
          <Link className="button secondary" href="/chat">
            Открыть чат
          </Link>
        </div>
      </div>
    </div>
  );
}
