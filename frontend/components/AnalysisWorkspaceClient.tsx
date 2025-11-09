"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalysisQueueItem } from "../lib/types";
import { getJSON } from "../lib/http";
import { AnalysisWorkspace } from "./AnalysisWorkspace";
import { clearAuthSession } from "../lib/auth";
import { useRouter } from "next/navigation";

interface QueueResponse {
  items: AnalysisQueueItem[];
  total: number;
  limit: number;
  skip: number;
}

export function AnalysisWorkspaceClient() {
  const [queue, setQueue] = useState<AnalysisQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJSON<QueueResponse>("/api/analysis/queue?limit=50&status=todo", {
        cache: "no-store"
      });
      setQueue(data?.items ?? []);
      setError(null);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message ?? "Unable to load analysis queue")
          : "Unable to load analysis queue";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  function handleLogout() {
    clearAuthSession();
    router.replace("/login");
  }

  return (
    <div className="page">
      <section className="card">
        <div className="inline-buttons">
          <button type="button" className="button-secondary" onClick={loadQueue} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh queue"}
          </button>
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
        {error ? <p className="error-state">{error}</p> : null}
      </section>
      <AnalysisWorkspace initialQueue={queue} />
    </div>
  );
}
