import OrderForm from '@/components/OrderForm';
import Protected from '@/components/Protected';

export default function CreateOrderPage() {
  return (
    <Protected>
      <div className="container">
        <OrderForm />
      </div>
    </Protected>
  );
}
