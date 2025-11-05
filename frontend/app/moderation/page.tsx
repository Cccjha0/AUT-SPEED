import { apiUrl } from '../../lib/config';
import { ModerationQueue, type SubmissionItem } from '../../components/ModerationQueue';

interface QueueResponse {
  data?: {
    items: SubmissionItem[];
    total: number;
    limit: number;
    skip: number;
  };
  error?: { message?: string } | null;
}

export default async function ModerationPage() {
  let items: SubmissionItem[] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const res = await fetch(apiUrl('/moderation/queue?limit=50&skip=0'), {
      cache: 'no-store'
    });

    const data = (await res.json().catch(() => ({}))) as QueueResponse;

    if (!res.ok) {
      error = data?.error?.message ?? `Unable to load moderation queue (${res.status})`;
    } else {
      items = data?.data?.items ?? [];
      total = data?.data?.total ?? items.length;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unable to load moderation queue';
  }

  return (
    <div className="page">
      <ModerationQueue items={items} total={total} initialError={error ?? undefined} />
    </div>
  );
}
