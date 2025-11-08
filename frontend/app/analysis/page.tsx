import { getJSON } from '../../lib/http';
import type { AnalysisQueueItem } from '../../lib/types';
import { AnalysisWorkspace } from '../../components/AnalysisWorkspace';

interface QueueResponse {
  items: AnalysisQueueItem[];
  total: number;
  limit: number;
  skip: number;
}

export default async function AnalysisPage() {
  let queue: AnalysisQueueItem[] = [];

  try {
    const data = await getJSON<QueueResponse>(
      '/api/analysis/queue?limit=50&status=todo',
      { cache: 'no-store' }
    );
    queue = data?.items ?? [];
  } catch {
    queue = [];
  }

  return (
    <div className="page">
      <section className="card">
        <h1>Analysis Workspace</h1>
        <p className="text-muted">
          Claim an accepted submission, review its metadata, and record the extracted evidence.
        </p>
      </section>
      <AnalysisWorkspace initialQueue={queue} />
    </div>
  );
}
