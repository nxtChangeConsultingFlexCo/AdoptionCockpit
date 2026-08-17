"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface AssessmentResultRow {
  id: string;
  name: string;
  checkTitle: string;
  createdAt: string;
  score: number | null;
}

interface AssessmentResultsTableProps {
  rows: AssessmentResultRow[];
}

const SORT_OPTIONS = {
  newest: "Neueste zuerst",
  oldest: "Älteste zuerst",
  score: "Score (hoch zuerst)",
  name: "Person (A–Z)",
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Client-seitig, da die zugrunde liegenden Ergebnisse bereits vollständig
// (ohne Paginierung) serverseitig geladen sind - für Suche/Sortierung ist
// kein zusätzlicher Round-Trip nötig, und der CSV-Export muss ohnehin im
// Browser laufen (Blob-Download).
export function AssessmentResultsTable({ rows }: AssessmentResultsTableProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(term) ||
            r.checkTitle.toLowerCase().includes(term),
        )
      : rows;

    return [...base].sort((a, b) => {
      switch (sort) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "score":
          return (b.score ?? -1) - (a.score ?? -1);
        case "name":
          return a.name.localeCompare(b.name, "de");
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [rows, query, sort]);

  function exportCsv() {
    const header = ["Person", "Check", "Datum", "Score"];
    const lines = [
      header,
      ...filteredRows.map((r) => [
        r.name,
        r.checkTitle,
        formatDate(r.createdAt),
        r.score != null ? String(r.score) : "",
      ]),
    ].map((cols) => cols.map(toCsvValue).join(","));
    // BOM voranstellen, damit Excel Umlaute in der CSV korrekt als UTF-8 erkennt.
    const csv = "﻿" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `check-ergebnisse-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1 sm:max-w-xs">
          <label htmlFor="results-search" className="text-xs text-muted-foreground">
            Suche
          </label>
          <Input
            id="results-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Person oder Check…"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="results-sort" className="text-xs text-muted-foreground">
            Sortierung
          </label>
          <select
            id="results-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectClassName}
          >
            {Object.entries(SORT_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={filteredRows.length === 0}
        >
          CSV exportieren
        </Button>
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          Keine Ergebnisse gefunden.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3">Person</th>
                  <th className="px-4 py-3">Check</th>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.checkTitle}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-foreground">
                      {row.score ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
