"use client";

import { useRef, useState, useTransition } from 'react';
import { z } from 'zod';
import { apiUrl } from '../lib/config';
import { parseBibtexEntry } from '../lib/bibtex';
import { ErrorMessage } from './ErrorMessage';
import { LoadingIndicator } from './LoadingIndicator';

interface FormState {
  submittedBy: string;
  submitterEmail: string;
  title: string;
  authors: string;
  venue: string;
  year: string;
  volume: string;
  number: string;
  pages: string;
  doi: string;
  bibtex: string;
}

const INITIAL_STATE: FormState = {
  submittedBy: '',
  submitterEmail: '',
  title: '',
  authors: '',
  venue: '',
  year: '',
  volume: '',
  number: '',
  pages: '',
  doi: '',
  bibtex: ''
};

const SubmissionSchema = z.object({
  submittedBy: z.string().min(1, 'Your name is required.'),
  submitterEmail: z.string().email('Valid email is required.'),
  title: z.string().min(1, 'Title is required.'),
  authors: z.array(z.string().min(1, 'Author name is required.')).min(1, 'Please provide at least one author (comma separated).'),
  venue: z.string().min(1, 'Venue is required.'),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later.')
    .max(new Date().getFullYear() + 1, 'Year is out of range.'),
  volume: z.string().min(1).optional(),
  number: z.string().min(1).optional(),
  pages: z.string().min(1).optional(),
  doi: z.string().optional()
});

export function SubmitForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [doiCheckResult, setDoiCheckResult] = useState<{
    exists: boolean;
    status?: string;
    lastDecisionAt?: string;
    decisionNotes?: string | null;
    value: string;
  } | null>(null);
  const [doiChecking, setDoiChecking] = useState(false);
  const [doiCheckError, setDoiCheckError] = useState<string | null>(null);
  const [lastCheckedDoi, setLastCheckedDoi] = useState('');

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function normalizeDoiInput(raw: string): { value?: string; error?: string } {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {};
    }
    const hasLinkPrefix =
      /^https?:\/\//i.test(trimmed) ||
      /^doi:/i.test(trimmed) ||
      /doi\.org/i.test(trimmed);
    if (hasLinkPrefix || !/^10\.\S+$/i.test(trimmed)) {
      return {
        error: 'DOI must be the identifier only (e.g. 10.1000/xyz123) without links.'
      };
    }
    return { value: trimmed };
  }

  function applyBibtex(text: string) {
    try {
      const parsed = parseBibtexEntry(text);
      if (
        !parsed.title &&
        !parsed.authors?.length &&
        !parsed.venue &&
        !parsed.year &&
        !parsed.volume &&
        !parsed.number &&
        !parsed.pages &&
        !parsed.doi
      ) {
        throw new Error('Unable to detect fields in the provided BibTeX.');
      }

      setForm(prev => ({
        ...prev,
        title: parsed.title ?? prev.title,
        authors:
          parsed.authors && parsed.authors.length
            ? parsed.authors.join(', ')
            : prev.authors,
        venue: parsed.venue ?? prev.venue,
        year: parsed.year ? String(parsed.year) : prev.year,
        volume: parsed.volume ?? prev.volume,
        number: parsed.number ?? prev.number,
        pages: parsed.pages ?? prev.pages,
        doi: parsed.doi ?? prev.doi,
        bibtex: text
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse BibTeX');
    }
  }

  async function performDoiCheck(value: string, silent = false) {
    setDoiChecking(true);
    try {
      const response = await fetch(
        apiUrl(`/api/submissions/check?doi=${encodeURIComponent(value)}`),
        { cache: 'no-store' }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error?.message ?? 'Unable to check DOI');
      }
      const result = {
        ...(json?.data ?? {}),
        value
      } as {
        exists: boolean;
        status?: string;
        lastDecisionAt?: string;
        decisionNotes?: string | null;
        value: string;
      };
      setDoiCheckResult(result);
      setLastCheckedDoi(value);
      setDoiCheckError(null);
      return result;
    } catch (err) {
      if (!silent) {
        setDoiCheckError(
          err instanceof Error ? err.message : 'Unable to check DOI right now.'
        );
      }
      setDoiCheckResult(null);
      throw err;
    } finally {
      setDoiChecking(false);
    }
  }

  async function ensureDoiCheck(normalized: string) {
    if (!normalized) {
      setDoiCheckResult(null);
      setLastCheckedDoi('');
      return null;
    }
    if (normalized === lastCheckedDoi && doiCheckResult) {
      return doiCheckResult;
    }
    try {
      return await performDoiCheck(normalized, true);
    } catch {
      return null;
    }
  }

  async function handleDoiBlur() {
    const trimmed = form.doi.trim();
    if (!trimmed) {
      setDoiCheckResult(null);
      setLastCheckedDoi('');
      setDoiCheckError(null);
      return;
    }
    const normalized = normalizeDoiInput(trimmed);
    if (normalized.error) {
      setDoiCheckError(normalized.error);
      setDoiCheckResult(null);
      return;
    }
    if (normalized.value) {
      try {
        await performDoiCheck(normalized.value, true);
      } catch {
        // background check failure can be ignored
      }
    }
  }

  async function handleBibtexFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const contents = await file.text();
    applyBibtex(contents);
    event.target.value = '';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const authors = form.authors
      .split(',')
      .map(author => author.trim())
      .filter(Boolean);

    const payload = {
      submittedBy: form.submittedBy.trim(),
      submitterEmail: form.submitterEmail.trim(),
      title: form.title.trim(),
      authors,
      venue: form.venue.trim(),
      year: Number.parseInt(form.year, 10),
      volume: form.volume.trim() || undefined,
      number: form.number.trim() || undefined,
      pages: form.pages.trim() || undefined,
      doi: form.doi.trim() || undefined
    };

    const validation = SubmissionSchema.safeParse(payload);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      setError(firstIssue?.message ?? 'Invalid submission');
      return;
    }

    let normalizedDoi: string | undefined;
    if (validation.data.doi) {
      const doiResult = normalizeDoiInput(validation.data.doi);
      if (doiResult.error) {
        setError(doiResult.error);
        return;
      }
      normalizedDoi = doiResult.value;
    }

    try {
      if (normalizedDoi) {
        const check = await ensureDoiCheck(normalizedDoi);
        if (check?.exists && check.status === 'accepted') {
          setError('This DOI already exists in the SPEED database.');
          return;
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to verify DOI at this time.'
      );
      return;
    }

    const submissionDto = {
      ...validation.data,
      doi: normalizedDoi
    };

    startTransition(async () => {
      try {
        const response = await fetch(apiUrl('/api/submissions'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submissionDto)
        });

        const result = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));

        if (!response.ok) {
          const messageFromApi = result?.error?.message ?? 'Submission failed';
          setError(Array.isArray(messageFromApi) ? messageFromApi.join(', ') : messageFromApi);
          return;
        }

          setMessage('Submission queued successfully.');
          setForm(INITIAL_STATE);
          setDoiCheckResult(null);
          setLastCheckedDoi('');
          setDoiCheckError(null);
        } catch (err) {
          const messageFromError = err instanceof Error ? err.message : 'Submission failed';
        setError(messageFromError);
      }
    });
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit} noValidate>
      <h1>Submit an Article</h1>
      <p className="text-muted">
        Provide article details to queue a new submission for moderation.
      </p>
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #d4d4d8',
          borderRadius: '4px',
          padding: '0.75rem',
          color: '#0f172a'
        }}
      >
        <p style={{ margin: 0, fontSize: '0.95rem' }}>
          Do not upload PDF files or external links. Only provide the DOI identifier (e.g. <code>10.1000/xyz123</code>) and citation details.
        </p>
      </div>
      <fieldset className="form-grid" style={{ border: '1px solid #d4d4d8', padding: '1rem', borderRadius: '4px' }}>
        <legend>Your information</legend>
        <label>
          Your name
          <input
            name="submittedBy"
            value={form.submittedBy}
            onChange={event => update('submittedBy', event.target.value)}
            required
          />
        </label>
        <label>
          Email (for notification)
          <input
            name="submitterEmail"
            type="email"
            value={form.submitterEmail}
            onChange={event => update('submitterEmail', event.target.value)}
            required
          />
        </label>
      </fieldset>
      <label>
        Title
        <input
          name="title"
          value={form.title}
          onChange={event => update('title', event.target.value)}
          required
        />
      </label>
      <label>
        Authors
        <input
          name="authors"
          placeholder="Separate names with commas"
          value={form.authors}
          onChange={event => update('authors', event.target.value)}
          required
        />
      </label>
      <label>
        Venue
        <input
          name="venue"
          value={form.venue}
          onChange={event => update('venue', event.target.value)}
          required
        />
      </label>
      <label>
        Year
        <input
          name="year"
          type="number"
          value={form.year}
          min={1900}
          max={new Date().getFullYear() + 1}
          onChange={event => update('year', event.target.value)}
          required
        />
      </label>
      <label>
        Volume (optional)
        <input
          name="volume"
          value={form.volume}
          onChange={event => update('volume', event.target.value)}
        />
      </label>
      <label>
        Issue/Number (optional)
        <input
          name="number"
          value={form.number}
          onChange={event => update('number', event.target.value)}
        />
      </label>
      <label>
        Pages (optional)
        <input
          name="pages"
          value={form.pages}
          onChange={event => update('pages', event.target.value)}
        />
      </label>
      <label>
        DOI (optional)
        <input
          name="doi"
          value={form.doi}
          onChange={event => update('doi', event.target.value)}
          onBlur={handleDoiBlur}
        />
      </label>
      {doiChecking ? <p className="text-muted">Checking DOI...</p> : null}
      {doiCheckResult?.exists ? (
        doiCheckResult.status === 'accepted' ? (
          <p className="error-state">
            This DOI already exists in the SPEED database and cannot be submitted again.
          </p>
        ) : (
          <p className="text-muted">
            Note: this DOI was previously rejected. Please include additional context before resubmitting.
          </p>
        )
      ) : null}
      {doiCheckError ? <p className="error-state">{doiCheckError}</p> : null}

      <fieldset className="form-grid" style={{ border: '1px solid #d4d4d8', padding: '1rem', borderRadius: '4px' }}>
        <legend>BibTeX Import (optional)</legend>
        <p className="text-muted">
          Paste a single BibTeX entry or upload a .bib file to prefill the form. You can still edit any field manually.
        </p>
        <label>
          BibTeX
          <textarea
            name="bibtex"
            value={form.bibtex}
            onChange={event => update('bibtex', event.target.value)}
            rows={5}
          />
        </label>
        <div className="inline-buttons">
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              if (!form.bibtex.trim()) {
                setError('Paste a BibTeX entry before importing.');
                return;
              }
              applyBibtex(form.bibtex);
            }}
          >
            Import from BibTeX
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload .bib
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".bib,.txt"
            onChange={handleBibtexFile}
            style={{ display: 'none' }}
          />
        </div>
      </fieldset>

      {error ? <ErrorMessage message={error} /> : null}
      {message ? <div className="success-state">{message}</div> : null}

      <div className="inline-buttons">
        <button type="submit" disabled={isPending}>
          {isPending ? <LoadingIndicator label="Submitting" /> : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm(INITIAL_STATE);
            setError(null);
            setMessage(null);
            setDoiCheckResult(null);
            setLastCheckedDoi('');
            setDoiCheckError(null);
          }}
          className="button-secondary"
          disabled={isPending}
        >
          Reset
        </button>
      </div>
    </form>
  );
}




