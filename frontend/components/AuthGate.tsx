"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession, getStoredRoles, getAuthToken } from "../lib/auth";

interface AuthGateProps {
  roles?: string[];
  children: React.ReactNode;
}

export function AuthGate({ roles = [], children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "denied" | "ok">("checking");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      clearAuthSession();
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return;
    }
    const storedRoles = getStoredRoles();
    if (roles.length && !roles.some(role => storedRoles.includes(role))) {
      setStatus("denied");
      return;
    }
    setStatus("ok");
  }, [roles, pathname, router]);

  if (status === "checking") {
    return <p className="text-muted">Checking access...</p>;
  }
  if (status === "denied") {
    return (
      <div className="card">
        <p className="error-state">You do not have permission to view this page.</p>
        <button type="button" className="button-secondary" onClick={() => router.replace("/")}>
          Go home
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
