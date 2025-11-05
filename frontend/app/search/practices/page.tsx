import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchSearchData } from '../../../lib/api';
import type { PracticeSummary } from '../../../lib/types';
import { PaginationControls } from '../../../components/PaginationControls';

export const metadata: Metadata = {
  title: 'Practices | SPEED Search'
};

interface PracticesPageProps {
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

export default async function PracticesPage({ searchParams }: PracticesPageProps) {
  const limit = parseNumber(searchParams?.limit, 10);
  const skip = parseNumber(searchParams?.skip, 0);
  const query = parseString(searchParams?.query);

  const response = await fetchSearchData<PracticeSummary>('/search/practices', {
    limit,
    skip,
    query
  });

  const items = response.data?.items ?? [];
  const total = response.data?.total ?? 0;

  return (
    <div className="page">
      <section className="card">
        <h1>Practices</h1>
        <p className="text-muted">
          Explore documented practices and drill into associated claims and evidence.
        </p>
        <form method="get" className="form-grid" role="search">
          <label>
            Search
            <input
              type="search"
              name="query"
              defaultValue={query}
              placeholder="Search practices by key or name"
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
          <p className="text-muted">No practices found. Try adjusting your search.</p>
        </section>
      ) : null}

      {items.map(practice => (
        <section className="card" key={practice.key}>
          <h2>{practice.name}</h2>
          <p className="text-muted">Key: {practice.key}</p>
          <div className="inline-buttons">
            <Link className="button-secondary" href={`/search/claims?practiceKey=${practice.key}`}>
              View Claims
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
