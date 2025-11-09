"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { EvidenceItem } from "../lib/types";
import { RatingButton } from "./RatingButton";

const STORAGE_KEY = "speed-evidence-columns";
const LOCKED_COLUMNS = new Set(["title", "actions"]);

type ColumnId =
  | "title"
  | "doi"
  | "result"
  | "method"
  | "participants"
  | "year"
  | "rating"
  | "actions";

interface ColumnDefinition {
  id: ColumnId;
  label: string;
  render: (item: EvidenceItem) => ReactNode;
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    id: "title",
    label: "Title",
    render: item => item.article?.title ?? "Untitled"
  },
  {
    id: "doi",
    label: "DOI",
    render: item => item.article?.doi ?? item.articleDoi
  },
  {
    id: "result",
    label: "Result",
    render: item => item.result
  },
  {
    id: "method",
    label: "Method",
    render: item => item.methodType
  },
  {
    id: "participants",
    label: "Participants",
    render: item => item.participantType ?? "unknown"
  },
  {
    id: "year",
    label: "Year",
    render: item => item.article?.year ?? "N/A"
  },
  {
    id: "rating",
    label: "Rating (avg / n)",
    render: item => {
      const average = item.avgRating?.average;
      const count = item.avgRating?.count ?? 0;
      if (average === null || average === undefined) {
        return <span title={`${count} ratings recorded`}>—</span>;
      }
      const tooltip = `${count} rating${count === 1 ? "" : "s"}`;
      return (
        <span title={tooltip}>
          {average.toFixed(2)} / {count}
        </span>
      );
    }
  },
  {
    id: "actions",
    label: "Actions",
    render: item => <RatingButton doi={item.article?.doi ?? item.articleDoi} />
  }
];

const DEFAULT_VISIBLE = COLUMN_DEFINITIONS.map(column => column.id);

interface EvidenceTableProps {
  items: EvidenceItem[];
}

export function EvidenceTable({ items }: EvidenceTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ColumnId[];
        if (Array.isArray(parsed) && parsed.length) {
          setVisibleColumns(parsed as ColumnId[]);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }
    setVisibleColumns(DEFAULT_VISIBLE);
  }, []);

  const effectiveColumns = useMemo(() => {
    const set = new Set(visibleColumns.length ? visibleColumns : DEFAULT_VISIBLE);
    LOCKED_COLUMNS.forEach(id => set.add(id as ColumnId));
    return COLUMN_DEFINITIONS.filter(column => set.has(column.id));
  }, [visibleColumns]);

  const toggleColumn = (id: ColumnId) => {
    if (LOCKED_COLUMNS.has(id)) {
      return;
    }
    setVisibleColumns(prev => {
      const hasColumn = prev.includes(id);
      let next: ColumnId[];
      if (hasColumn) {
        next = prev.filter(columnId => columnId !== id);
        if (!next.length) {
          next = prev;
        }
      } else {
        next = [...prev, id];
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <div>
      <details style={{ marginBottom: "1rem" }}>
        <summary style={{ cursor: "pointer" }}>Column visibility</summary>
        <div className="column-selector">
          {COLUMN_DEFINITIONS.map(column => (
            <label key={column.id} className="label-inline" style={{ marginBottom: "0.25rem" }}>
              <input
                type="checkbox"
                checked={visibleColumns.includes(column.id)}
                disabled={LOCKED_COLUMNS.has(column.id)}
                onChange={() => toggleColumn(column.id)}
              />
              {column.label}
            </label>
          ))}
        </div>
      </details>
      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {effectiveColumns.map(column => (
                <th key={column.id} align="left">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                {effectiveColumns.map(column => (
                  <td key={column.id}>{column.render(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
