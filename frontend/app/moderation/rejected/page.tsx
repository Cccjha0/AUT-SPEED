import Link from 'next/link';
import { AuthGate } from '../../../components/AuthGate';
import { RejectedSubmissionsView } from '../../../components/RejectedSubmissionsView';

export default function RejectedPage() {
  return (
    <AuthGate roles={['moderator']}>
      <div className="page">
        <section className="card">
          <div className="inline-buttons" style={{ marginBottom: '0.5rem' }}>
            <Link className="button-secondary" href="/moderation">
              Back to Moderation Queue
            </Link>
          </div>
        </section>
        <RejectedSubmissionsView />
      </div>
    </AuthGate>
  );
}
