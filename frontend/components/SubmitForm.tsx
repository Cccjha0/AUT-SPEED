"use client";

import { useState, useTransition } from 'react';
import { z } from 'zod';
import { apiUrl } from '../lib/config';
import { ErrorMessage } from './ErrorMessage';
import { LoadingIndicator } from './LoadingIndicator';

interface FormState {
  title: string;
  authors: string;
  venue: string;
  year: string;
  doi: string;
}

const INITIAL_STATE: FormState = {
  title: '',
  authors: '',
  venue: '',
  year: '',
  doi: ''
};

const SubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  authors: z.array(z.string().min(1, 'Author name is required.')).min(1, 'Please provide at least one author (comma separated).'),
  venue: z.string().min(1, 'Venue is required.'),
  year: z
    .number()
    .int()
    .min(1900, 'Year must be 1900 or later.')
    .max(new Date().getFullYear() + 1, 'Year is out of range.'),
  doi: z
    .string()
    .min(1)
    .optional()
});

export function SubmitForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
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
      title: form.title.trim(),
      authors,
      venue: form.venue.trim(),
      year: Number.parseInt(form.year, 10),
      doi: form.doi.trim() || undefined
    };

    const validation = SubmissionSchema.safeParse(payload);

    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      setError(firstIssue?.message ?? 'Invalid submission');
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(apiUrl('/api/submissions'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(validation.data)
        });

        const result = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));

        if (!response.ok) {
          const messageFromApi = result?.error?.message ?? 'Submission failed';
          setError(Array.isArray(messageFromApi) ? messageFromApi.join(', ') : messageFromApi);
          return;
        }

        setMessage('Submission queued successfully.');
        setForm(INITIAL_STATE);
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
        DOI (optional)
        <input
          name="doi"
          value={form.doi}
          onChange={event => update('doi', event.target.value)}
        />
      </label>

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

