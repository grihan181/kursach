import OrderDetailCard from '@/components/OrderDetailCard';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container">
      <OrderDetailCard id={params.id} />
    </div>
  );
}
