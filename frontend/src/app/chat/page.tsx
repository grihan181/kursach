import ChatPanel from '@/components/ChatPanel';
import Protected from '@/components/Protected';

export default function ChatPage({ searchParams }: { searchParams: { orderId?: string } }) {
  return (
    <Protected>
      <div className="container">
        <ChatPanel initialOrderId={searchParams?.orderId} />
      </div>
    </Protected>
  );
}
