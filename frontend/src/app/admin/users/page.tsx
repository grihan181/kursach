import AdminGate from '@/components/AdminGate';
import Protected from '@/components/Protected';
import UserAdminPanel from '@/components/UserAdminPanel';

export default function AdminUsersPage() {
  return (
    <Protected>
      <AdminGate>
        <div className="container">
          <UserAdminPanel />
        </div>
      </AdminGate>
    </Protected>
  );
}
