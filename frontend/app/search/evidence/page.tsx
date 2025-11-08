import Link from "next/link";
import { getJSON } from "../../../lib/http";
import type {
  ClaimSummary,
  EvidenceItem,
  EvidenceMethodType,
  EvidenceParticipantType,
  PracticeSummary,
  SearchResponse
} from "../../../lib/types";
import { PaginationControls } from "../../../components/PaginationControls";
import { RatingButton } from "../../../components/RatingButton";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { fromPageSize } from "../../../lib/url";
import { SaveQueryControls } from "../../../components/SaveQueryControls";

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

const methodOptions: EvidenceMethodType[] = ["experiment", "case-study", "survey", "meta-analysis", "other"];
const participantOptions: EvidenceParticipantType[] = ["student", "practitioner", "mixed", "unknown"];

export default async function EvidencePage({ searchParams }: EvidencePageProps) {
  const practiceKey = parseString(searchParams?.practiceKey);
  const claimKey = parseString(searchParams?.claimKey);
  const result = parseString(searchParams?.result);
  const methodType = parseString(searchParams?.methodType);
  const participantType = parseString(searchParams?.participantType);
  const from = parseNumber(searchParams?.from);
  const to = parseNumber(searchParams?.to);
  const { page, size, limit, skip } = fromPageSize({
    page: parseNumber(searchParams?.page),
    size: parseNumber(searchParams?.size),
    limit: parseNumber(searchParams?.limit),
    skip: parseNumber(searchParams?.skip)
  });

  let errorMessage: string | null = null;
  let items: EvidenceItem[] = [];
  let total = 0;
  let resultCounts: Record<string, number> = {};
  let practices: PracticeSummary[] = [];
  let claims: ClaimSummary[] = [];

  try {
    const data = await getJSON<SearchResponse<EvidenceItem>["data"]>(
      `/api/search/evidence${buildQuery({
        limit,
        skip,
        practiceKey,
        claimKey,
        result,
        methodType,
        participantType,
        from,
        to
      })}`,
      {
        next: { revalidate: 60 }
      }
    );

    items = data?.items ?? [];
    total = data?.total ?? 0;
    resultCounts = (data?.aggregations?.resultCounts ?? {}) as Record<string, number>;
  } catch (error) {
    errorMessage =
      typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message ?? "Unable to load evidence")
        : "Unable to load evidence";
  }

  try {
    const practiceData = await getJSON<SearchResponse<PracticeSummary>["data"]>(
      "/api/search/practices?limit=100",
      { next: { revalidate: 300 } }
    );
    practices = practiceData?.items ?? [];
  } catch {
    practices = [];
  }

  try {
    const claimParams = new URLSearchParams({ limit: "100" });
    if (practiceKey) {
      claimParams.set("practiceKey", practiceKey);
    }
    const claimData = await getJSON<SearchResponse<ClaimSummary>["data"]>(
      `/api/search/claims?${claimParams.toString()}`,
      { next: { revalidate: 300 } }
    );
    claims = claimData?.items ?? [];
  } catch {
    claims = [];
  }

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
  const filtersForSave: Record<string, string | number> = {};
  if (practiceKey) {
    filtersForSave.practiceKey = practiceKey;
  }
  if (claimKey) {
    filtersForSave.claimKey = claimKey;
  }
  if (result) {
    filtersForSave.result = result;
  }
  if (methodType) {
    filtersForSave.methodType = methodType;
  }
  if (participantType) {
    filtersForSave.participantType = participantType;
  }
  if (typeof from === "number" && !Number.isNaN(from)) {
    filtersForSave.from = from;
  }
  if (typeof to === "number" && !Number.isNaN(to)) {
    filtersForSave.to = to;
  }

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
            Practice
            <select name="practiceKey" defaultValue={practiceKey ?? ""}>
              <option value="">All practices</option>
              {practices.map(practice => (
                <option key={practice.key} value={practice.key}>
                  {practice.name} ({practice.key})
                </option>
              ))}
            </select>
          </label>
          <label>
            Claim
            <select name="claimKey" defaultValue={claimKey ?? ""}>
              <option value="">All claims</option>
              {claims.map(claim => (
                <option key={claim.key} value={claim.key}>
                  {claim.text} ({claim.key})
                </option>
              ))}
            </select>
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
            Method
            <select name="methodType" defaultValue={methodType ?? ""}>
              <option value="">All methods</option>
              {methodOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Participant type
            <select name="participantType" defaultValue={participantType ?? ""}>
              <option value="">All participants</option>
              {participantOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
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
          <Link className="button-secondary" href="/search/saved">
            View Saved Queries
          </Link>
        </div>
        <SaveQueryControls filters={filtersForSave} />
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

      {errorMessage ? (
        <section className="card">
          <ErrorMessage message={errorMessage ?? "Unable to load evidence"} />
        </section>
      ) : null}

      {!errorMessage && items.length === 0 ? (
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
