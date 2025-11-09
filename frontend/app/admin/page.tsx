import { AuthGate } from '../../components/AuthGate';

export default function AdminPage() {
  return (
    <AuthGate roles={['admin']}>
      <div className="page">
        <section className="card">
          <h1>Admin Console</h1>
          <p className="text-muted">
            Manage practices, claims, and seed data. Future iterations will expose full CRUD tools.
          </p>
          <p>
            seeding endpoints remain available via CLI or HTTP. This placeholder ensures only administrators can access
            the route.
          </p>
        </section>
      </div>
    </AuthGate>
  );
}
