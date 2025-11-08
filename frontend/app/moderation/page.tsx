import Link from 'next/link';
import { ModerationQueue, type SubmissionItem } from '../../components/ModerationQueue';
import { getJSON } from '../../lib/http';

interface QueueResponse {
  items: SubmissionItem[];
  total: number;
  limit: number;
  skip: number;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export default async function ModerationPage() {
  let items: SubmissionItem[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const data = await getJSON<QueueResponse>(
      `/api/moderation/queue${buildQuery({ limit: 50, skip: 0 })}`,
      { cache: 'no-store' }
    );
    items = data?.items ?? [];
    total = data?.total ?? items.length;
  } catch (err) {
    error =
      typeof err === 'object' && err && 'message' in err
        ? String((err as { message?: string }).message ?? 'Unable to load moderation queue')
        : 'Unable to load moderation queue';
  }

  return (
    <div className="page">
      <section className="card">
        <div className="inline-buttons">
          <Link className="button-secondary" href="/moderation/rejected">
            View Rejected Submissions
          </Link>
        </div>
      </section>
      <ModerationQueue items={items} total={total} initialError={error ?? undefined} />
    </div>
  );
}
