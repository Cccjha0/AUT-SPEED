import HealthStatus from '../components/HealthStatus';

export default function HomePage() {
  return (
    <div className="page">
      <section className="card">
        <h1>Welcome to SPEED</h1>
        <p>
          Collaborate on submissions, moderation, and evidence-backed practices from a unified
          monorepo starter.
        </p>
      </section>
      <HealthStatus />
    </div>
  );
}

