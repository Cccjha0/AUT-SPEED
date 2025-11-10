import { AuthGate } from '../../components/AuthGate';
import { AdminDashboardClient } from '../../components/AdminDashboardClient';

export default function AdminPage() {
  return (
    <AuthGate roles={['admin']}>
      <AdminDashboardClient />
    </AuthGate>
  );
}
