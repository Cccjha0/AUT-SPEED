import Link from "next/link";
import { getJSON } from "../../../lib/http";
import type { SavedQuery } from "../../../lib/types";

interface SavedQueriesPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function parseString(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function buildQueryString(filters: Record<string, string | number>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

function formatTimestamp(value: string | undefined) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default async function SavedQueriesPage({ searchParams }: SavedQueriesPageProps) {
  const owner = parseString(searchParams?.owner)?.trim().toLowerCase() ?? "";
  let savedQueries: SavedQuery[] = [];
  let errorMessage: string | null = null;

  if (owner) {
    try {
      const data = await getJSON<{ items: SavedQuery[]; total: number }>(
        `/api/search/saved?owner=${encodeURIComponent(owner)}`
      );
      savedQueries = data?.items ?? [];
    } catch (error) {
      errorMessage =
        typeof error === "object" && error && "message" in error
          ? String((error as { message?: string }).message ?? "Unable to load saved queries")
          : "Unable to load saved queries";
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h1>Saved Queries</h1>
        <p className="text-muted">Enter your owner identifier to view and rerun saved evidence queries.</p>
        <form className="form-grid" method="get">
          <label>
            Owner
            <input name="owner" defaultValue={owner} placeholder="your email" />
          </label>
          <button type="submit">Load queries</button>
        </form>
        <div className="inline-buttons">
          <Link className="button-secondary" href="/search/evidence">
            Back to evidence search
          </Link>
        </div>
      </section>
      {errorMessage ? (
        <section className="card">
          <p className="error-state">{errorMessage}</p>
        </section>
      ) : null}
      {owner && !errorMessage ? (
        <section className="card">
          {savedQueries.length === 0 ? (
            <p className="text-muted">No saved queries for this owner.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {savedQueries.map(saved => {
                const query = (saved.query ?? {}) as Record<string, string | number>;
                return (
                  <li key={saved._id} style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.2)", padding: "1rem 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <strong>{saved.name}</strong>
                        <small className="text-muted">{formatTimestamp(saved.createdAt)}</small>
                      </div>
                      <code style={{ fontSize: "0.85rem" }}>{JSON.stringify(query)}</code>
                      <div className="inline-buttons">
                        <Link href={`/search/evidence${buildQueryString(query)}`}>Run query</Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
