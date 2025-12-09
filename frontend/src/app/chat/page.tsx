import ChatPanel from '@/components/ChatPanel';
import Protected from '@/components/Protected';

export default function ChatPage() {
  return (
    <Protected>
      <div className="container">
        <ChatPanel />
      </div>
    </Protected>
  );
}
