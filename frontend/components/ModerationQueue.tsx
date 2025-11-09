
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { apiUrl } from '../lib/config';
import { getJSON } from '../lib/http';
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

interface SubmissionHistory {
  exists: boolean;
  status?: string;
  lastDecisionAt?: string;
  decisionNotes?: string | null;
}

interface HistoryEntry {
  loading: boolean;
  info?: SubmissionHistory;
  error?: string;
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
  const [decisions, setDecisions] = useState<Record<string, {
    peerReviewed?: boolean;
    seRelated?: boolean;
    decisionNotes?: string;
  }>>({});
  const [history, setHistory] = useState<Record<string, HistoryEntry>>({});
  const fetchedHistory = useRef<Set<string>>(new Set());

  useEffect(() => {
    setDecisions(prev => {
      const next = { ...prev };
      queue.forEach(item => {
        if (!next[item._id]) {
          next[item._id] = {
            peerReviewed: item.peerReviewed ?? undefined,
            seRelated: item.seRelated ?? undefined,
            decisionNotes: item.decisionNotes ?? ''
          };
        }
      });
      return next;
    });
  }, [queue]);

  useEffect(() => {
    queue.forEach(item => {
      const doi = item.doi?.trim().toLowerCase();
      if (!doi || fetchedHistory.current.has(doi)) {
        return;
      }
      fetchedHistory.current.add(doi);
      setHistory(prev => ({ ...prev, [doi]: { loading: true } }));
      void getJSON<SubmissionHistory>(`/api/submissions/check?doi=${encodeURIComponent(doi)}`)
        .then(info => {
          setHistory(prev => ({ ...prev, [doi]: { loading: false, info } }));
        })
        .catch(() => {
          setHistory(prev => ({
            ...prev,
            [doi]: { loading: false, error: 'Unable to fetch prior submission history.' }
          }));
        });
    });
  }, [queue]);

  const hasItems = queue.length > 0;
  const ensureDecisionValue = (id: string, field: 'peerReviewed' | 'seRelated', value: boolean) => {
    setDecisions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

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
      action === 'accept' &&
      (typeof decision.peerReviewed !== 'boolean' || typeof decision.seRelated !== 'boolean')
    ) {
      setError('Mark peer-review status and SE relevance before accepting.');
      return;
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

        const result = await response
          .json()
          .catch(() => ({ error: { message: 'Unknown error' } }));

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
              {renderHistoryCallout(item.doi, history)}
              <div className="form-grid">
                <fieldset className="field-group">
                  <legend>
                    Peer-reviewed venue?
                    {typeof decisions[item._id]?.peerReviewed !== 'boolean' ? (
                      <span className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        Select Yes or No
                      </span>
                    ) : null}
                  </legend>
                  <div className="inline-radio">
                    <label className="label-inline">
                      <input
                        type="radio"
                        name={`peer-reviewed-${item._id}`}
                        checked={decisions[item._id]?.peerReviewed === true}
                        onChange={() => ensureDecisionValue(item._id, 'peerReviewed', true)}
                      />
                      Yes
                    </label>
                    <label className="label-inline">
                      <input
                        type="radio"
                        name={`peer-reviewed-${item._id}`}
                        checked={decisions[item._id]?.peerReviewed === false}
                        onChange={() => ensureDecisionValue(item._id, 'peerReviewed', false)}
                      />
                      No
                    </label>
                  </div>
                </fieldset>
                <fieldset className="field-group">
                  <legend>
                    Relevant to SE practice?
                    {typeof decisions[item._id]?.seRelated !== 'boolean' ? (
                      <span className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                        Select Yes or No
                      </span>
                    ) : null}
                  </legend>
                  <div className="inline-radio">
                    <label className="label-inline">
                      <input
                        type="radio"
                        name={`se-related-${item._id}`}
                        checked={decisions[item._id]?.seRelated === true}
                        onChange={() => ensureDecisionValue(item._id, 'seRelated', true)}
                      />
                      Yes
                    </label>
                    <label className="label-inline">
                      <input
                        type="radio"
                        name={`se-related-${item._id}`}
                        checked={decisions[item._id]?.seRelated === false}
                        onChange={() => ensureDecisionValue(item._id, 'seRelated', false)}
                      />
                      No
                    </label>
                  </div>
                </fieldset>
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

function renderHistoryCallout(
  doi: string | undefined,
  history: Record<string, HistoryEntry>
) {
  if (!doi) {
    return (
      <div className="history-callout warning-state">
        DOI missing; perform manual duplicate checks before deciding.
      </div>
    );
  }
  const key = doi.trim().toLowerCase();
  const entry = history[key];
  if (!entry || entry.loading) {
    return <div className="history-callout text-muted">Checking existing submissions…</div>;
  }
  if (entry.error) {
    return <div className="history-callout warning-state">{entry.error}</div>;
  }
  if (!entry.info?.exists) {
    return <div className="history-callout success-state">No prior submissions with this DOI.</div>;
  }
  const status = entry.info.status ?? 'unknown';
  const note =
    status === 'accepted'
      ? 'This article is already accepted in SPEED.'
      : status === 'rejected'
        ? 'This article was previously rejected.'
        : `Existing record detected (status: ${status}).`;
  return (
    <div className="history-callout warning-state">
      {note}
      {entry.info.lastDecisionAt ? ` Last decision: ${new Date(entry.info.lastDecisionAt).toLocaleDateString()}.` : null}
      {entry.info.decisionNotes ? <div className="text-muted">Notes: {entry.info.decisionNotes}</div> : null}
    </div>
  );
}
