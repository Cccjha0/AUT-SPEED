"use client";

import { useMemo, type ChangeEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PaginationControlsProps {
  limit: number;
  skip: number;
  total: number;
}

function clampLimit(limit: number) {
  if (Number.isNaN(limit) || limit <= 0) {
    return 10;
  }
  return Math.min(limit, 100);
}

export function PaginationControls({ limit, skip, total }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const safeLimit = clampLimit(limit);
  const safeSkip = Math.max(0, skip);

  const { hasPrev, hasNext } = useMemo(() => {
    return {
      hasPrev: safeSkip > 0,
      hasNext: safeSkip + safeLimit < total
    };
  }, [safeLimit, safeSkip, total]);

  function buildUrl(newSkip: number, newLimit = safeLimit) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', String(newLimit));
    params.set('skip', String(Math.max(0, newSkip)));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function updateLimit(event: ChangeEvent<HTMLSelectElement>) {
    const newLimit = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(newLimit)) {
      return;
    }
    router.push(buildUrl(0, newLimit));
  }

  function goToPrevious() {
    if (!hasPrev) {
      return;
    }
    router.push(buildUrl(safeSkip - safeLimit));
  }

  function goToNext() {
    if (!hasNext) {
      return;
    }
    router.push(buildUrl(safeSkip + safeLimit));
  }

  return (
    <div className="inline-buttons" aria-label="Pagination controls">
      <button type="button" onClick={goToPrevious} disabled={!hasPrev}>
        Previous
      </button>
      <button type="button" onClick={goToNext} disabled={!hasNext}>
        Next
      </button>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="text-muted">Page size</span>
        <select value={safeLimit} onChange={updateLimit}>
          {[10, 20, 50, 100].map(value => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <span className="text-muted">Total: {total}</span>
    </div>
  );
}
