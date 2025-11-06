"use client";

import { useCallback, useState } from 'react';
import { API_BASE } from '../lib/config';
import type { RatingsAverageResponse } from '../lib/types';
import { fetchRealtimeJson } from '../lib/api/search';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorMessage } from './ErrorMessage';

interface RatingButtonProps {
  doi: string;
}

export function RatingButton({ doi }: RatingButtonProps) {
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const tooltip = average === null ? 'No ratings yet' : `${average.toFixed(2)} stars (${count ?? 0})`;

  const fetchAverage = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { response, payload } = await fetchRealtimeJson<{
        data?: RatingsAverageResponse;
        error?: { message?: string } | null;
      }>('/ratings/avg', { doi });

      if (!response.ok) {
        setError(payload?.error?.message ?? 'Unable to load rating');
        return;
      }

      setAverage(payload.data?.average ?? null);
      setCount(payload.data?.count ?? 0);
      setIsOptimistic(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load rating');
    } finally {
      setIsLoading(false);
    }
  }, [doi]);

  async function handleRate() {
    const value = window.prompt('Rate this article (1-5 stars)');
    if (!value) {
      return;
    }
    const stars = Number.parseInt(value, 10);
    if (Number.isNaN(stars) || stars < 1 || stars > 5) {
      window.alert('Please provide a number between 1 and 5.');
      return;
    }

    const user = window.prompt('Enter your name (optional)') ?? undefined;

    const previousState = {
      average,
      count
    };

    try {
      setIsLoading(true);
      setError(null);

      const currentCount = previousState.count ?? 0;
      const nextCount = currentCount + 1;
      const nextAverage =
        previousState.average === null
          ? stars
          : ((previousState.average ?? 0) * currentCount + stars) / nextCount;

      setAverage(nextAverage);
      setCount(nextCount);
      setIsOptimistic(true);

      const response = await fetch(`${API_BASE}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doi, stars, user: user?.trim() || undefined })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = payload?.error?.message ?? 'Unable to submit rating';
        setAverage(previousState.average ?? null);
        setCount(previousState.count ?? null);
        setIsOptimistic(false);
        setError(Array.isArray(message) ? message.join(', ') : message);
        return;
      }

      window.alert('Thanks for your rating!');
      await fetchAverage();
    } catch (err) {
      setIsOptimistic(false);
      setAverage(previousState.average ?? null);
      setCount(previousState.count ?? null);
      setError(err instanceof Error ? err.message : 'Unable to submit rating');
    } finally {
      setIsLoading(false);
    }
  }

  function handleHover() {
    if (!hasFetched) {
      setHasFetched(true);
      void fetchAverage();
    }
  }

  return (
    <div className="rating-control">
      <button
        type="button"
        className="button-secondary"
        onClick={handleRate}
        onMouseEnter={handleHover}
        onFocus={handleHover}
        title={tooltip}
      >
        Rate
      </button>
      {isOptimistic && !isLoading && !error ? (
        <span className="text-muted" role="status" aria-live="polite">
          {average !== null ? `${average.toFixed(2)} stars pending…` : null}
        </span>
      ) : null}
      {isLoading ? <LoadingIndicator label="" /> : null}
      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}
