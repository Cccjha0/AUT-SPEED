"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SubmissionItem } from "./ModerationQueue";
import { getJSON } from "../lib/http";

interface RejectionResponse {
  items: (SubmissionItem & {
    rejectionReason?: string;
    decisionNotes?: string;
    lastDecisionAt?: string;
  })[];
  total: number;
}

const LIMIT = 50;

export function RejectedSubmissionsView() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [formQuery, setFormQuery] = useState(searchParams?.get("query") ?? "");
  const [formYear, setFormYear] = useState(searchParams?.get("year") ?? "");
  const [filters, setFilters] = useState(() => ({
    query: searchParams?.get("query") ?? "",
    year: searchParams?.get("year") ?? ""
  }));
  const [items, setItems] = useState<RejectionResponse["items"]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRejections = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.query) {
        params.set("query", filters.query);
      }
      if (filters.year) {
        params.set("year", filters.year);
      }
      params.set("limit", String(LIMIT));
      params.set("skip", "0");
      const data = await getJSON<RejectionResponse>(`/api/submissions/rejections?${params.toString()}`, {
        cache: "no-store"
      });
      setItems(data?.items ?? []);
      setTotal(data?.total ?? 0);
      setError(null);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message ?? "Unable to load rejections")
          : "Unable to load rejections";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadRejections();
  }, [loadRejections]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = {
      query: formQuery.trim(),
      year: formYear.trim()
    };
    setFilters(nextFilters);
    const params = new URLSearchParams();
    if (nextFilters.query) {
      params.set("query", nextFilters.query);
    }
    if (nextFilters.year) {
      params.set("year", nextFilters.year);
    }
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  function handleReset() {
    setFormQuery("");
    setFormYear("");
    setFilters({ query: "", year: "" });
    router.replace(pathname);
  }

  const statusLabel = useMemo(() => {
    if (loading) {
      return "Loading rejected submissions...";
    }
    return `${total} rejected submission${total === 1 ? "" : "s"} found.`;
  }, [loading, total]);

  return (
    <>
      <section className="card">
        <h1>Rejected Submissions</h1>
        <p className="text-muted">
          Review previously rejected submissions and their moderation notes. Only moderators can access this view.
        </p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Search
            <input
              type="search"
              value={formQuery}
              onChange={event => setFormQuery(event.target.value)}
              placeholder="Filter by title, author, DOI..."
            />
          </label>
          <label>
            Year
            <input
              type="number"
              value={formYear}
              onChange={event => setFormYear(event.target.value)}
              placeholder="e.g. 2023"
            />
          </label>
          <div className="inline-buttons" style={{ alignItems: "flex-end" }}>
            <button type="submit" disabled={loading}>
              Apply filters
            </button>
            <button type="button" className="button-secondary" onClick={handleReset} disabled={loading}>
              Reset
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        {error ? <p className="error-state">{error}</p> : <p className="text-muted">{statusLabel}</p>}
      </section>

      {!error && items.length === 0 ? (
        <section className="card">
          <p className="text-muted">No rejected submissions match your filters.</p>
        </section>
      ) : null}

      {items.length ? (
        <section className="card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th align="left">Title</th>
                <th align="left">Authors</th>
                <th align="left">Year</th>
                <th align="left">DOI</th>
                <th align="left">Reason</th>
                <th align="left">Decision Notes</th>
                <th align="left">Submitter</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td>{item.authors?.join(", ") ?? "N/A"}</td>
                  <td>{item.year ?? "N/A"}</td>
                  <td>{item.doi ?? "N/A"}</td>
                  <td>{item.rejectionReason ?? "N/A"}</td>
                  <td>{item.decisionNotes ?? "—"}</td>
                  <td>
                    {item.submittedBy ?? "Unknown"}
                    {item.submitterEmail ? ` (${item.submitterEmail})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
