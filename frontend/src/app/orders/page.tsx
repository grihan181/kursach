import OrderList from '@/components/OrderList';
import Protected from '@/components/Protected';

export default function OrdersPage() {
  return (
    <Protected>
      <div className="container">
        <OrderList />
      </div>
    </Protected>
  );
}
