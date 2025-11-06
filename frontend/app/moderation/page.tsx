import { ModerationQueue, type SubmissionItem } from '../../components/ModerationQueue';
import { fetchRealtimeJson } from '../../lib/api/search';

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
    const { response, payload } = await fetchRealtimeJson<QueueResponse>('/moderation/queue', {
      limit: 50,
      skip: 0
    });

    if (!response.ok) {
      error = payload?.error?.message ?? `Unable to load moderation queue (${response.status})`;
    } else {
      items = payload?.data?.items ?? [];
      total = payload?.data?.total ?? items.length;
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
