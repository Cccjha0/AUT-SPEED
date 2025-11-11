"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getJSON, patchJSON, postJSON } from '../lib/http';
import type { AnalysisQueueItem, EvidenceResult, EvidenceMethodType, EvidenceParticipantType } from '../lib/types';
import { ErrorMessage } from './ErrorMessage';

interface AnalysisWorkspaceProps {
  initialQueue: AnalysisQueueItem[];
}

interface PrefillResponse {
  title?: string;
  authors?: string[];
  venue?: string;
  year?: number;
  doi?: string;
  assignedAnalyst?: string;
  analysisStatus?: string;
}

const resultOptions: EvidenceResult[] = ['agree', 'disagree', 'mixed'];
const methodOptions: EvidenceMethodType[] = [
  'experiment',
  'case-study',
  'survey',
  'meta-analysis',
  'other'
];
const participantOptions: EvidenceParticipantType[] = [
  'student',
  'practitioner',
  'mixed',
  'unknown'
];

export function AnalysisWorkspace({ initialQueue }: AnalysisWorkspaceProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [selectedDoi, setSelectedDoi] = useState<string | null>(
    initialQueue.find(item => item.doi)?.doi ?? null
  );
  const [prefill, setPrefill] = useState<PrefillResponse | null>(null);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(false);
  const [analystId, setAnalystId] = useState('');
  const [analystInput, setAnalystInput] = useState('');
  const [formState, setFormState] = useState({
    practiceKey: '',
    claimKey: '',
    result: 'agree' as EvidenceResult,
    methodType: 'experiment' as EvidenceMethodType,
    participantType: 'practitioner' as EvidenceParticipantType,
    notes: '',
    year: ''
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = useMemo(
    () => queue.find(item => item.doi === selectedDoi),
    [queue, selectedDoi]
  );

  useEffect(() => {
    setQueue(initialQueue);
    setSelectedDoi(prev => {
      if (!initialQueue.length) {
        return null;
      }
      if (prev && initialQueue.some(item => item.doi === prev)) {
        return prev;
      }
      return initialQueue.find(item => item.doi)?.doi ?? null;
    });
  }, [initialQueue]);

  useEffect(() => {
    const stored = window.localStorage.getItem('speed-analyst-id');
    if (stored) {
      setAnalystId(stored);
      setAnalystInput(stored);
    }
  }, []);

  useEffect(() => {
    if (selected?.doi) {
      void loadPrefill(selected.doi);
    } else {
      setPrefill(null);
    }
  }, [selected?.doi]);

  async function loadPrefill(doi: string) {
    setIsLoadingPrefill(true);
    setPrefillError(null);
    try {
      const data = await getJSON<PrefillResponse>(
        `/api/evidence/prefill?doi=${encodeURIComponent(doi)}`
      );
      setPrefill(data);
    } catch (err) {
      setPrefillError(
        err instanceof Error ? err.message : 'Unable to load article metadata'
      );
    } finally {
      setIsLoadingPrefill(false);
    }
  }

  const handleAssign = useCallback(async () => {
    if (!selected?.doi || !analystInput.trim()) {
      setError('Enter your analyst identifier before assigning.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await patchJSON(`/api/analysis/${encodeURIComponent(selected.doi)}/assign`, {
        analystId: analystInput.trim()
      });
      setAnalystId(analystInput.trim());
      window.localStorage.setItem('speed-analyst-id', analystInput.trim());
      setMessage('Submission assigned.');
      setQueue(prev =>
        prev.map(item =>
          item.doi === selected.doi
            ? { ...item, assignedAnalyst: analystInput.trim() }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign submission');
    }
  }, [analystInput, selected?.doi]);

  const handleStart = useCallback(async () => {
    if (!selected?.doi) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await patchJSON(`/api/analysis/${encodeURIComponent(selected.doi)}/start`, {});
      setMessage('Analysis started.');
      setQueue(prev =>
        prev.map(item =>
          item.doi === selected.doi
            ? { ...item, analysisStatus: 'in_progress' }
            : item
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start analysis');
    }
  }, [selected?.doi]);

  const handleDone = useCallback(async () => {
    if (!selected?.doi) {
      return;
    }
    try {
      await patchJSON(`/api/analysis/${encodeURIComponent(selected.doi)}/done`, {});
      setQueue(prev => prev.filter(item => item.doi !== selected.doi));
      setSelectedDoi(prev => {
        if (prev === selected.doi) {
          return null;
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete analysis');
    }
  }, [selected?.doi]);

  async function handleEvidenceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected?.doi) {
      return;
    }
    if (!analystId) {
      setError('Assign yourself before submitting evidence.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await postJSON('/api/evidence', {
        articleDoi: selected.doi,
        practiceKey: formState.practiceKey.trim(),
        claimKey: formState.claimKey.trim(),
        result: formState.result,
        methodType: formState.methodType,
        participantType: formState.participantType,
        notes: formState.notes.trim() || undefined,
        analyst: analystId
      });
      await handleDone();
      setMessage('Evidence saved and analysis marked done.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to submit evidence'
      );
    }
  }

  return (
    <section className="card">
      <div className="inline-buttons" style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Your analyst ID"
          value={analystInput}
          onChange={event => setAnalystInput(event.target.value)}
        />
        <button type="button" onClick={handleAssign} className="button-secondary">
          Set / Assign
        </button>
      </div>
      {message ? <div className="success-state">{message}</div> : null}
      {error ? <ErrorMessage message={error} /> : null}
      <div className="analysis-grid">
        <aside>
          <h2>Pending submissions</h2>
          {queue.length === 0 ? (
            <p className="text-muted">No submissions waiting for analysis.</p>
          ) : (
            <ul className="list">
              {queue.map(item => (
                <li key={item._id}>
                  <button
                    type="button"
                    className={item.doi === selectedDoi ? 'active' : ''}
                    onClick={() => setSelectedDoi(item.doi ?? null)}
                  >
                    <strong>{item.title}</strong>
                    <br />
                    <small>
                      {item.doi} · {item.assignedAnalyst ?? 'Unassigned'}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div>
          {selected ? (
            <div>
              <h2>{selected.title}</h2>
              <p className="text-muted">
                {selected.authors?.join(', ')} · {selected.venue} · {selected.year}
              </p>
              <p className="text-muted">DOI: {selected.doi}</p>
              <div className="inline-buttons">
                <button type="button" onClick={handleStart} disabled={!selected.doi}>
                  Start analysis
                </button>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleDone}
                  disabled={!selected.doi}
                >
                  Mark done
                </button>
              </div>
              <hr />
              {isLoadingPrefill ? (
                <p className="text-muted">Loading metadata...</p>
              ) : prefillError ? (
                <p className="error-state">{prefillError}</p>
              ) : (
                <div className="prefill">
                  <h3>Metadata</h3>
                  <p>
                    <strong>Title:</strong> {prefill?.title ?? selected.title}
                  </p>
                  <p>
                    <strong>Authors:</strong>{' '}
                    {prefill?.authors?.join(', ') ?? selected.authors?.join(', ') ?? 'N/A'}
                  </p>
                  <p>
                    <strong>Venue/Year:</strong> {prefill?.venue ?? selected.venue} ·{' '}
                    {prefill?.year ?? selected.year}
                  </p>
                </div>
              )}
              <form className="form-grid" onSubmit={handleEvidenceSubmit}>
                <label>
                  Practice key
                  <input
                    value={formState.practiceKey}
                    onChange={event =>
                      setFormState(prev => ({ ...prev, practiceKey: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Claim key
                  <input
                    value={formState.claimKey}
                    onChange={event =>
                      setFormState(prev => ({ ...prev, claimKey: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Result
                  <select
                    value={formState.result}
                    onChange={event =>
                      setFormState(prev => ({
                        ...prev,
                        result: event.target.value as EvidenceResult
                      }))
                    }
                  >
                    {resultOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Method type
                  <select
                    value={formState.methodType}
                    onChange={event =>
                      setFormState(prev => ({
                        ...prev,
                        methodType: event.target.value as EvidenceMethodType
                      }))
                    }
                  >
                    {methodOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Participant type
                  <select
                    value={formState.participantType}
                    onChange={event =>
                      setFormState(prev => ({
                        ...prev,
                        participantType: event.target.value as EvidenceParticipantType
                      }))
                    }
                  >
                    {participantOptions.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Analyst notes
                  <textarea
                    value={formState.notes}
                    onChange={event =>
                      setFormState(prev => ({ ...prev, notes: event.target.value }))
                    }
                    rows={4}
                  />
                </label>
                <button type="submit" disabled={!selected.doi}>
                  Save evidence
                </button>
              </form>
            </div>
          ) : (
            <p className="text-muted">Select a submission from the queue.</p>
          )}
        </div>
      </div>
    </section>
  );
}

