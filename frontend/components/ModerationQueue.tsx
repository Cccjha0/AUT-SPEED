"use client";

import { useMemo, useState, useTransition } from 'react';
import { API_BASE } from '../lib/config';
import { ErrorMessage } from './ErrorMessage';
import { LoadingIndicator } from './LoadingIndicator';

export interface SubmissionItem {
  _id: string;
  title: string;
  authors?: string[];
  venue?: string;
  year?: number;
  doi?: string;
  status: string;
  rejectionReason?: string;
  submittedBy?: string;
  createdAt?: string;
}

interface ModerationQueueProps {
  items: SubmissionItem[];
  total: number;
  initialError?: string | null;
}

export function ModerationQueue({ items, total, initialError }: ModerationQueueProps) {
  const [queue, setQueue] = useState(items);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasItems = queue.length > 0;

  function handleAction(id: string, action: 'accept' | 'reject') {
    const submission = queue.find(item => item._id === id);
    if (!submission) {
      return;
    }

    let payload: Record<string, unknown> | undefined;
    if (action === 'reject') {
      const reason = window.prompt('Provide a rejection reason');
      if (!reason) {
        return;
      }
      payload = { rejectionReason: reason };
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(`${API_BASE}/moderation/${id}/${action}`, {
          method: 'POST',
          headers: payload ? { 'Content-Type': 'application/json' } : undefined,
          body: payload ? JSON.stringify(payload) : undefined
        });

        const result = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));

        if (!response.ok) {
          const messageFromApi = result?.error?.message ?? `Failed to ${action} submission`;
          setError(Array.isArray(messageFromApi) ? messageFromApi.join(', ') : messageFromApi);
          return;
        }

        setQueue(prev => prev.filter(item => item._id !== id));
        setMessage(`Submission ${action === 'accept' ? 'accepted' : 'rejected'}.`);
      } catch (err) {
        const messageFromError = err instanceof Error ? err.message : `Failed to ${action} submission`;
        setError(messageFromError);
      }
    });
  }

  const subtitle = useMemo(() => {
    if (!hasItems) {
      return 'No submissions are waiting for moderation.';
    }
    return `${queue.length} of ${total} queued submissions`;
  }, [hasItems, queue.length, total]);

  return (
    <section className="card">
      <h1>Moderation Queue</h1>
      <p className="text-muted">{subtitle}</p>

      {error ? <ErrorMessage message={error} /> : null}
      {message ? <div className="success-state">{message}</div> : null}

      {isPending ? <LoadingIndicator label="Processing" /> : null}

      {hasItems ? (
        <div className="queue-grid">
          {queue.map(item => (
            <article key={item._id} className="queue-item card">
              <h2>{item.title}</h2>
              <p className="text-muted">
                {item.venue ? `${item.venue} - ` : ''}
                {item.year ?? 'Year N/A'}
              </p>
              {item.authors?.length ? <p>Authors: {item.authors.join(', ')}</p> : null}
              {item.doi ? (
                <p className="text-muted">
                  DOI: <span>{item.doi}</span>
                </p>
              ) : null}
              {item.submittedBy ? <p className="text-muted">Submitted by: {item.submittedBy}</p> : null}
              <div className="inline-buttons">
                <button type="button" onClick={() => handleAction(item._id, 'accept')} disabled={isPending}>
                  Accept
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => handleAction(item._id, 'reject')}
                  disabled={isPending}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}


