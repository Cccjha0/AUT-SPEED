import Link from 'next/link';
import type { Metadata } from 'next';
import { getJSON } from '../../../lib/http';
import type { ClaimSummary, SearchResponse } from '../../../lib/types';
import { PaginationControls } from '../../../components/PaginationControls';
import { fromPageSize } from '../../../lib/url';

export const metadata: Metadata = {
  title: 'Claims | SPEED Search'
};

interface ClaimsPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function parseNumber(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  const parsed = Array.isArray(value) ? Number.parseInt(value[0], 10) : Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseString(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export default async function ClaimsPage({ searchParams }: ClaimsPageProps) {
  const practiceKey = parseString(searchParams?.practiceKey);
  const query = parseString(searchParams?.query);
  const { page, size, limit, skip } = fromPageSize({
    page: parseNumber(searchParams?.page),
    size: parseNumber(searchParams?.size),
    limit: parseNumber(searchParams?.limit),
    skip: parseNumber(searchParams?.skip)
  });

  if (!practiceKey) {
    return (
      <div className="page">
        <section className="card">
          <h1>Claims</h1>
          <p className="error-state">Missing practiceKey. Select a practice first.</p>
          <Link className="button-secondary" href="/search/practices">
            Browse Practices
          </Link>
        </section>
      </div>
    );
  }

  let errorMessage: string | null = null;
  let items: ClaimSummary[] = [];
  let total = 0;

  try {
    const data = await getJSON<SearchResponse<ClaimSummary>['data']>(
      `/api/search/claims${buildQuery({ practiceKey, query, limit, skip })}`,
      {
        next: { revalidate: 60 }
      }
    );
    items = data?.items ?? [];
    total = data?.total ?? 0;
  } catch (error) {
    errorMessage =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: string }).message ?? 'Unable to load claims')
        : 'Unable to load claims';
  }

  return (
    <div className="page">
      <section className="card">
        <h1>Claims for {practiceKey}</h1>
        <div className="inline-buttons">
          <Link className="button-secondary" href="/search/practices">
            Back to Practices
          </Link>
        </div>
        <form method="get" className="form-grid" role="search">
          <input type="hidden" name="practiceKey" value={practiceKey} />
          <label>
            Search
            <input
              type="search"
              name="query"
              defaultValue={query}
              placeholder="Search claims by key or text"
            />
          </label>
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="size" value={size} />
          <button type="submit">Apply</button>
        </form>
      </section>

      {errorMessage ? (
        <section className="card">
          <p className="error-state">{errorMessage}</p>
        </section>
      ) : null}

      {!errorMessage && items.length === 0 ? (
        <section className="card">
          <p className="text-muted">No claims found for this practice.</p>
        </section>
      ) : null}

      {items.map(claim => (
        <section className="card" key={claim.key}>
          <h2>{claim.key}</h2>
          <p>{claim.text}</p>
          <div className="inline-buttons">
            <Link
              className="button-secondary"
              href={`/search/evidence?practiceKey=${practiceKey}&claimKey=${claim.key}`}
            >
              Browse Evidence
            </Link>
          </div>
        </section>
      ))}

      {total > 0 ? <PaginationControls page={page} size={size} total={total} /> : null}
    </div>
  );
}
