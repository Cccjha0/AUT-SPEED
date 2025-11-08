"use client";

import { useEffect, useMemo, useState, useTransition } from 'react';
import { apiUrl } from '../lib/config';
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
  submitterEmail?: string;
  peerReviewed?: boolean | null;
  seRelated?: boolean | null;
  decisionNotes?: string | null;
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
  const [decisions, setDecisions] = useState<Record<
    string,
    { peerReviewed?: boolean; seRelated?: boolean; decisionNotes?: string }
  >>({});

  useEffect(() => {
    setDecisions(prev => {
      const next = { ...prev };
      queue.forEach(item => {
        if (!next[item._id]) {
          next[item._id] = {};
        }
      });
      return next;
    });
  }, [queue]);

  const hasItems = queue.length > 0;

  function handleAction(id: string, action: 'accept' | 'reject') {
    const submission = queue.find(item => item._id === id);
    if (!submission) {
      return;
    }

    const decision = decisions[id] ?? {};
    let payload: Record<string, unknown> | undefined;
    if (action === 'reject') {
      const reason = window.prompt('Provide a rejection reason');
      if (!reason) {
        return;
      }
      payload = {
        rejectionReason: reason,
        peerReviewed: decision.peerReviewed,
        seRelated: decision.seRelated,
        decisionNotes: decision.decisionNotes
      };
    } else if (
      decision.peerReviewed !== undefined ||
      decision.seRelated !== undefined ||
      (decision.decisionNotes && decision.decisionNotes.trim())
    ) {
      payload = {
        peerReviewed: decision.peerReviewed,
        seRelated: decision.seRelated,
        decisionNotes: decision.decisionNotes
      };
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const response = await fetch(apiUrl(`/api/moderation/${id}/${action}`), {
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
              <p className="text-muted">
                Submitted by: {item.submittedBy ?? 'Unknown'}
                {item.submitterEmail ? ` (${item.submitterEmail})` : ''}
              </p>
              <div className="form-grid">
                <label>
                  <input
                    type="checkbox"
                    checked={decisions[item._id]?.peerReviewed ?? false}
                    onChange={event =>
                      setDecisions(prev => ({
                        ...prev,
                        [item._id]: { ...prev[item._id], peerReviewed: event.target.checked }
                      }))
                    }
                  />
                  &nbsp;Peer-reviewed venue
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={decisions[item._id]?.seRelated ?? false}
                    onChange={event =>
                      setDecisions(prev => ({
                        ...prev,
                        [item._id]: { ...prev[item._id], seRelated: event.target.checked }
                      }))
                    }
                  />
                  &nbsp;Relevant to SE practice
                </label>
                <label>
                  Decision notes
                  <textarea
                    value={decisions[item._id]?.decisionNotes ?? ''}
                    onChange={event =>
                      setDecisions(prev => ({
                        ...prev,
                        [item._id]: { ...prev[item._id], decisionNotes: event.target.value }
                      }))
                    }
                    rows={3}
                  />
                </label>
              </div>
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


