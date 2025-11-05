import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchSearchData } from '../../../lib/api';
import type { ClaimSummary } from '../../../lib/types';
import { PaginationControls } from '../../../components/PaginationControls';

export const metadata: Metadata = {
  title: 'Claims | SPEED Search'
};

interface ClaimsPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function parseNumber(value: string | string[] | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Array.isArray(value) ? Number.parseInt(value[0], 10) : Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseString(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export default async function ClaimsPage({ searchParams }: ClaimsPageProps) {
  const practiceKey = parseString(searchParams?.practiceKey);
  const limit = parseNumber(searchParams?.limit, 10);
  const skip = parseNumber(searchParams?.skip, 0);
  const query = parseString(searchParams?.query);

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

  const response = await fetchSearchData<ClaimSummary>('/search/claims', {
    practiceKey,
    query,
    limit,
    skip
  });

  const items = response.data?.items ?? [];
  const total = response.data?.total ?? 0;

  return (
    <div className="page">
      <section className="card">
        <h1>Claims for {practiceKey}</h1>
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
          <input type="hidden" name="limit" value={limit} />
          <button type="submit">Apply</button>
        </form>
      </section>

      {response.error ? (
        <section className="card">
          <p className="error-state">{response.error.message}</p>
        </section>
      ) : null}

      {!response.error && items.length === 0 ? (
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

      {total > 0 ? (
        <PaginationControls limit={limit} skip={skip} total={total} />
      ) : null}
    </div>
  );
}
