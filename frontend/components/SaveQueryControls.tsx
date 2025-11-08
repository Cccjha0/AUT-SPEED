"use client";

import { useEffect, useState } from "react";
import { postJSON } from "../lib/http";
import { ErrorMessage } from "./ErrorMessage";

interface SaveQueryControlsProps {
  filters: Record<string, string | number>;
}

export function SaveQueryControls({ filters }: SaveQueryControlsProps) {
  const [owner, setOwner] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedOwner = window.localStorage.getItem("speed-search-owner");
    if (storedOwner) {
      setOwner(storedOwner);
    }
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const trimmedOwner = owner.trim();
    const trimmedName = name.trim();
    if (!trimmedOwner) {
      setError("Owner is required.");
      return;
    }
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (!Object.keys(filters).length) {
      setError("Define at least one filter before saving.");
      return;
    }
    setIsSaving(true);
    try {
      await postJSON("/api/search/saved", {
        owner: trimmedOwner,
        name: trimmedName,
        query: filters
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("speed-search-owner", trimmedOwner);
      }
      setMessage("Query saved.");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save query");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSave}>
      <label>
        Saved query name
        <input
          value={name}
          onChange={event => setName(event.target.value)}
          placeholder="e.g. Agile claims 2018+"
        />
      </label>
      <label>
        Owner
        <input
          value={owner}
          onChange={event => setOwner(event.target.value)}
          placeholder="your email"
        />
      </label>
      <div className="inline-buttons">
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save this query"}
        </button>
      </div>
      {message ? <div className="success-state">{message}</div> : null}
      {error ? <ErrorMessage message={error} /> : null}
    </form>
  );
}
