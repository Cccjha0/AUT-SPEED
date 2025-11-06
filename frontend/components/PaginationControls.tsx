"use client";

import { useMemo, type ChangeEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fromPageSize } from "../lib/url";

interface PaginationControlsProps {
  page: number;
  size: number;
  total: number;
  onPageChange?: (params: { page: number; size: number; limit: number; skip: number }) => void;
  sizeOptions?: number[];
}

export function PaginationControls({
  page,
  size,
  total,
  onPageChange,
  sizeOptions = [10, 20, 50, 100]
}: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const normalized = fromPageSize({ page, size });
  const safeSize = normalized.size;
  const safePage = normalized.page;
  const totalPages = Math.max(1, Math.ceil(total / safeSize) || 1);
  const currentPage = Math.min(safePage, totalPages);

  const { hasPrev, hasNext } = useMemo(() => {
    return {
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages
    };
  }, [currentPage, totalPages]);

  function buildUrl(newPage: number, newSize = safeSize) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    params.set("size", String(newSize));
    params.delete("limit");
    params.delete("skip");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function notify(newPage: number, newSize: number) {
    if (!onPageChange) {
      return;
    }
    const derived = fromPageSize({ page: newPage, size: newSize });
    onPageChange({
      page: derived.page,
      size: derived.size,
      limit: derived.limit,
      skip: derived.skip
    });
  }

  function updateSize(event: ChangeEvent<HTMLSelectElement>) {
    const newSize = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(newSize)) {
      return;
    }
    notify(1, newSize);
    router.push(buildUrl(1, newSize));
  }

  function goToPrevious() {
    if (!hasPrev) {
      return;
    }
    const newPage = currentPage - 1;
    notify(newPage, safeSize);
    router.push(buildUrl(newPage));
  }

  function goToNext() {
    if (!hasNext) {
      return;
    }
    const newPage = currentPage + 1;
    notify(newPage, safeSize);
    router.push(buildUrl(newPage));
  }

  return (
    <div
      className="inline-buttons"
      aria-label="Pagination controls"
      style={{ flexWrap: "wrap", alignItems: "center", gap: "0.75rem" }}
    >
      <button type="button" onClick={goToPrevious} disabled={!hasPrev}>
        Previous
      </button>
      <span className="text-muted">
        Page {currentPage} of {totalPages}
      </span>
      <button type="button" onClick={goToNext} disabled={!hasNext}>
        Next
      </button>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          whiteSpace: "nowrap",
          flexShrink: 0
        }}
      >
        <span className="text-muted">Size</span>
        <select value={safeSize} onChange={updateSize}>
          {sizeOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <span className="text-muted">Total: {total}</span>
    </div>
  );
}
