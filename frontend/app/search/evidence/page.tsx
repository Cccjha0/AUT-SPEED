import Link from "next/link";
import { fetchSearchList } from "../../../lib/api/search";
import type { EvidenceItem } from "../../../lib/types";
import { PaginationControls } from "../../../components/PaginationControls";
import { RatingButton } from "../../../components/RatingButton";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { fromPageSize } from "../../../lib/url";

interface EvidencePageProps {
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

export default async function EvidencePage({ searchParams }: EvidencePageProps) {
  const practiceKey = parseString(searchParams?.practiceKey);
  const claimKey = parseString(searchParams?.claimKey);
  const result = parseString(searchParams?.result);
  const from = parseNumber(searchParams?.from);
  const to = parseNumber(searchParams?.to);
  const { page, size, limit, skip } = fromPageSize({
    page: parseNumber(searchParams?.page),
    size: parseNumber(searchParams?.size),
    limit: parseNumber(searchParams?.limit),
    skip: parseNumber(searchParams?.skip)
  });

  const response = await fetchSearchList<EvidenceItem>("/search/evidence", {
    limit,
    skip,
    practiceKey,
    claimKey,
    result,
    from,
    to
  });

  const items = response.data?.items ?? [];
  const total = response.data?.total ?? 0;
  const resultCounts = (response.data?.aggregations?.resultCounts ?? {}) as Record<string, number>;

  const backToPracticesHref = "/search/practices";
  const backToClaimsHref = practiceKey ? `/search/claims?practiceKey=${practiceKey}` : null;
  const resetParams = new URLSearchParams({
    page: '1',
    size: '10'
  });
  if (practiceKey) {
    resetParams.set('practiceKey', practiceKey);
  }
  if (claimKey) {
    resetParams.set('claimKey', claimKey);
  }
  const resetHref = `/search/evidence?${resetParams.toString()}`;

  return (
    <div className="page">
      <section className="card">
        <h1>Evidence</h1>
        <div className="inline-buttons">
          <Link className="button-secondary" href={backToPracticesHref}>
            Back to Practices
          </Link>
          {backToClaimsHref ? (
            <Link className="button-secondary" href={backToClaimsHref}>
              Back to Claims
            </Link>
          ) : null}
        </div>
        <p className="text-muted">
          Filter and review evidence records, rate articles, and inspect aggregated outcomes.
        </p>
        <form className="form-grid" method="get">
          <label>
            Practice Key
            <input name="practiceKey" defaultValue={practiceKey ?? ""} />
          </label>
          <label>
            Claim Key
            <input name="claimKey" defaultValue={claimKey ?? ""} />
          </label>
          <label>
            Result
            <select name="result" defaultValue={result ?? ""}>
              <option value="">All</option>
              <option value="agree">Agree</option>
              <option value="disagree">Disagree</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
          <label>
            Year From
            <input type="number" name="from" defaultValue={!Number.isNaN(from) ? from : ""} />
          </label>
          <label>
            Year To
            <input type="number" name="to" defaultValue={!Number.isNaN(to) ? to : ""} />
          </label>
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="size" value={size} />
          <button type="submit">Apply Filters</button>
        </form>
        <div className="inline-buttons">
          <Link className="button-secondary" href={resetHref}>
            Reset Filters
          </Link>
        </div>
      </section>

      {resultCounts ? (
        <section className="card">
          <h2>Result Summary</h2>
          <p className="text-muted">
            Agree: {resultCounts.agree ?? 0} | Disagree: {resultCounts.disagree ?? 0} | Mixed: {
            resultCounts.mixed ?? 0}
          </p>
        </section>
      ) : null}

      {response.error ? (
        <section className="card">
          <ErrorMessage message={response.error.message ?? "Unable to load evidence"} />
        </section>
      ) : null}

      {!response.error && items.length === 0 ? (
        <section className="card">
          <p className="text-muted">No evidence found. Adjust your filters or try a different claim.</p>
        </section>
      ) : null}

      {items.length ? (
        <section className="card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th align="left">Title</th>
                <th align="left">DOI</th>
                <th align="left">Result</th>
                <th align="left">Method</th>
                <th align="left">Participants</th>
                <th align="left">Year</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const article = item.article ?? {
                  title: undefined,
                  year: undefined,
                  doi: item.articleDoi
                };
                return (
                  <tr key={item._id}>
                    <td>{article.title ?? "Untitled"}</td>
                    <td>{article.doi}</td>
                    <td>{item.result}</td>
                    <td>{item.methodType}</td>
                    <td>{item.participantType ?? "unknown"}</td>
                    <td>{article.year ?? "N/A"}</td>
                    <td>
                      <RatingButton doi={article.doi} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      {total > 0 ? <PaginationControls page={page} size={size} total={total} /> : null}
    </div>
  );
}
