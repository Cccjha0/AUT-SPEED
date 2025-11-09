import Link from 'next/link';
import { AuthGate } from '../../components/AuthGate';
import { ModerationView } from '../../components/ModerationView';

export default function ModerationPage() {
  return (
    <AuthGate roles={['moderator']}>
      <div className="page">
        <section className="card">
          <div className="inline-buttons">
            <Link className="button-secondary" href="/moderation/rejected">
              View Rejected Submissions
            </Link>
          </div>
        </section>
        <ModerationView />
      </div>
    </AuthGate>
  );
}
