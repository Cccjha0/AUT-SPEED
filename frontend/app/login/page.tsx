"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAuthSession, storeAuthSession } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const json = await resp.json();
      const token: string | undefined = json?.data?.token;
      const roles: string[] = json?.data?.roles ?? [];
      if (!token) {
        throw new Error("Authentication failed");
      }
      storeAuthSession(token, roles);
      const next = searchParams?.get("next") ?? "/moderation";
      router.replace(next);
    } catch (err) {
      clearAuthSession();
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page">
      <section className="card">
        <h1>Staff Sign In</h1>
        <p className="text-muted">
          Moderation, analysis, and admin tools require authentication. Use the credentials provided by the SPEED team.
        </p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Username
            <input value={username} onChange={event => setUsername(event.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="error-state">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          Public submission and evidence search remain accessible without signing in.
        </p>
      </section>
    </div>
  );
}
