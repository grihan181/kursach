import OrderDetailCard from '@/components/OrderDetailCard';
import Protected from '@/components/Protected';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <Protected>
      <div className="container">
        <OrderDetailCard id={params.id} />
      </div>
    </Protected>
  );
}
