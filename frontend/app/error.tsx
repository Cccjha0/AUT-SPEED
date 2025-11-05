"use client";

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page">
      <section className="card">
        <h1>Something went wrong</h1>
        <p className="error-state">{error.message}</p>
        <button type="button" onClick={() => reset()}>
          Try again
        </button>
      </section>
    </div>
  );
}
