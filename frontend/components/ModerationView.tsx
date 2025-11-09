"use client";

import { useCallback, useEffect, useState } from "react";
import { ModerationQueue, type SubmissionItem } from "./ModerationQueue";
import { getJSON } from "../lib/http";
import { clearAuthSession } from "../lib/auth";
import { useRouter } from "next/navigation";

interface QueueResponse {
  items: SubmissionItem[];
  total: number;
  limit: number;
  skip: number;
}

export function ModerationView() {
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJSON<QueueResponse>("/api/moderation/queue?limit=50&skip=0", {
        cache: "no-store"
      });
      setItems(data?.items ?? []);
      setTotal(data?.total ?? data?.items?.length ?? 0);
      setError(null);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message ?? "Unable to load moderation queue")
          : "Unable to load moderation queue";
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
    <>
      <section className="card">
        <div className="inline-buttons">
          <button type="button" className="button-secondary" onClick={loadQueue} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh queue"}
          </button>
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </section>
      <ModerationQueue items={items} total={total} initialError={error ?? undefined} />
    </>
  );
}
