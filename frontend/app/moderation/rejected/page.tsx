import Link from 'next/link';
import { getJSON } from '../../../lib/http';
import type { SubmissionItem } from '../../../components/ModerationQueue';

interface RejectionResponse {
  items: (
    SubmissionItem & {
      rejectionReason?: string;
      decisionNotes?: string;
      lastDecisionAt?: string;
    }
  )[];
  total: number;
  limit: number;
  skip: number;
}

function parseString(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function parseNumber(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  const parsed = Array.isArray(value) ? Number(value[0]) : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

export default async function RejectedPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const query = parseString(searchParams?.query);
  const year = parseNumber(searchParams?.year);
  const limit = parseNumber(searchParams?.limit) ?? 20;
  const skip = parseNumber(searchParams?.skip) ?? 0;

  let response: RejectionResponse | null = null;
  let error: string | null = null;

  try {
    response = await getJSON<RejectionResponse>(
      `/api/submissions/rejections${buildQuery({
        query,
        year,
        limit,
        skip
      })}`,
      { cache: 'no-store' }
    );
  } catch (err) {
    error =
      typeof err === 'object' && err && 'message' in err
        ? String((err as { message?: string }).message ?? 'Unable to load rejections')
        : 'Unable to load rejections';
  }

  const items = response?.items ?? [];

  return (
    <div className="page">
      <section className="card">
        <h1>Rejected Submissions</h1>
        <p className="text-muted">
          Review previously rejected submissions and their moderation notes.
        </p>
        <form method="get" className="form-grid">
          <label>
            Search
            <input
              type="search"
              name="query"
              placeholder="Filter by title, author, DOI..."
              defaultValue={query}
            />
          </label>
          <label>
            Year
            <input type="number" name="year" defaultValue={year ?? ''} />
          </label>
          <div className="inline-buttons" style={{ alignItems: 'flex-end' }}>
            <button type="submit">Apply</button>
            <Link className="button-secondary" href="/moderation/rejected">
              Reset
            </Link>
          </div>
        </form>
        <div className="inline-buttons" style={{ marginTop: '0.5rem' }}>
          <Link className="button-secondary" href="/moderation">
            Back to Moderation Queue
          </Link>
        </div>
      </section>

      {error ? (
        <section className="card">
          <p className="error-state">{error}</p>
        </section>
      ) : (
        <section className="card">
          <p className="text-muted">
            {response?.total ?? 0} rejected submission{(response?.total ?? 0) === 1 ? '' : 's'} matched.
          </p>
        </section>
      )}

      {!error && items.length === 0 ? (
        <section className="card">
          <p className="text-muted">No rejected submissions match your filters.</p>
        </section>
      ) : null}

      {items.length ? (
        <section className="card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th align="left">Title</th>
                <th align="left">Authors</th>
                <th align="left">Year</th>
                <th align="left">DOI</th>
                <th align="left">Reason</th>
                <th align="left">Decision Notes</th>
                <th align="left">Reviewer</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.authors?.join(', ') ?? 'N/A'}</td>
                  <td>{item.year ?? 'N/A'}</td>
                  <td>{item.doi ?? 'N/A'}</td>
                  <td>{item.rejectionReason ?? 'N/A'}</td>
                  <td>{item.decisionNotes ?? '—'}</td>
                  <td>
                    {item.submittedBy}
                    {item.submitterEmail ? ` (${item.submitterEmail})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
