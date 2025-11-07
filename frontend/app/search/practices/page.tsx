import Link from 'next/link';
import type { Metadata } from 'next';
import { getJSON } from '../../../lib/http';
import type { PracticeSummary, SearchResponse } from '../../../lib/types';
import { PaginationControls } from '../../../components/PaginationControls';
import { fromPageSize } from '../../../lib/url';

export const metadata: Metadata = {
  title: 'Practices | SPEED Search'
};

interface PracticesPageProps {
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

export default async function PracticesPage({ searchParams }: PracticesPageProps) {
  const query = parseString(searchParams?.query);
  const { page, size, limit, skip } = fromPageSize({
    page: parseNumber(searchParams?.page),
    size: parseNumber(searchParams?.size),
    limit: parseNumber(searchParams?.limit),
    skip: parseNumber(searchParams?.skip)
  });

  let errorMessage: string | null = null;
  let items: PracticeSummary[] = [];
  let total = 0;

  try {
    const data = await getJSON<SearchResponse<PracticeSummary>['data']>(
      `/api/search/practices${buildQuery({ limit, skip, query })}`,
      {
        next: { revalidate: 60 }
      }
    );
    items = data?.items ?? [];
    total = data?.total ?? 0;
  } catch (error) {
    errorMessage =
      typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: string }).message ?? 'Unable to load practices')
        : 'Unable to load practices';
  }

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
        <PaginationControls page={page} size={size} total={total} />
      ) : null}
    </div>
  );
}
