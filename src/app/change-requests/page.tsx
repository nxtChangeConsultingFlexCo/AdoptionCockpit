import Link from "next/link";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getSelectedProject } from "@/lib/project-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoadmapTabs } from "@/components/roadmap-tabs";
import { ProjectSwitcher } from "@/components/projects/project-switcher";
import { StatusBadge } from "@/components/change-requests/status-badge";
import { KanbanBoard } from "@/components/change-requests/kanban-board";
import type { ChangeRequestRow, ChangeRequestStatus } from "@/types/governance";

const STATUS_FILTERS: Record<string, { label: string; statuses: ChangeRequestStatus[] }> = {
  submitted: { label: "Unbehandelt", statuses: ["submitted"] },
  in_progress: {
    label: "In Behandlung",
    statuses: ["cab_review", "qualified", "it_backlog", "in_implementation"],
  },
  done: { label: "Erledigt", statuses: ["done"] },
};

const SORT_OPTIONS = {
  newest: "Neueste zuerst",
  oldest: "Älteste zuerst",
  priority: "Priorität (hoch zuerst)",
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function ChangeRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string; view?: string }>;
}) {
  await requireUser("/change-requests");
  const { status, q, sort, view } = await searchParams;
  const filter = status ? STATUS_FILTERS[status] : undefined;
  const sortKey: SortKey = sort && sort in SORT_OPTIONS ? (sort as SortKey) : "newest";
  const isBoardView = view === "board";
  const supabase = await createClient();

  function buildHref(overrides: { view?: string }): string {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    if (overrides.view) params.set("view", overrides.view);
    const qs = params.toString();
    return qs ? `/change-requests?${qs}` : "/change-requests";
  }
  const listHref = buildHref({});
  const boardHref = buildHref({ view: "board" });

  const { projectId, projects } = await getSelectedProject(supabase);

  let query = supabase
    .from("change_requests")
    .select(
      "id, title, description, status, priority, created_at, updated_at, requested_by, assigned_leader, organization_id, project_id, cab_decision_note, it_feedback",
    )
    .eq("project_id", projectId ?? "")
    .order("created_at", { ascending: sortKey === "oldest" });

  // In der Kanban-Ansicht ist die Statusgruppierung selbst der Filter -
  // ein zusätzlicher Status-Chip würde die meisten Spalten künstlich
  // leeren, daher greift er dort nicht.
  if (filter && !isBoardView) {
    query = query.in("status", filter.statuses);
  }
  if (q?.trim()) {
    const term = q.trim().replace(/[%,]/g, "");
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data } = await query;

  let requests = (data ?? []) as ChangeRequestRow[];
  if (sortKey === "priority") {
    requests = [...requests].sort(
      (a, b) =>
        (PRIORITY_RANK[b.priority ?? ""] ?? 0) - (PRIORITY_RANK[a.priority ?? ""] ?? 0),
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Roadmap
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Eure Change-Roadmap
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <RoadmapTabs />
          <ProjectSwitcher projects={projects} selected={projectId} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Anfragen</h2>
            {filter && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Filter: {filter.label}
                <Link
                  href="/change-requests"
                  className="text-primary/70 hover:text-primary"
                  aria-label="Filter zurücksetzen"
                >
                  ×
                </Link>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
              <Link
                href={listHref}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  !isBoardView
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Liste
              </Link>
              <Link
                href={boardHref}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  isBoardView
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Kanban
              </Link>
            </div>
            <Button render={<Link href="/change-requests/new" />}>
              Neue Idee einreichen
            </Button>
          </div>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3">
          {status && !isBoardView && <input type="hidden" name="status" value={status} />}
          {isBoardView && <input type="hidden" name="view" value="board" />}
          <div className="flex flex-1 flex-col gap-1 sm:max-w-xs">
            <label htmlFor="q" className="text-xs text-muted-foreground">
              Suche
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Titel oder Beschreibung…"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="sort" className="text-xs text-muted-foreground">
              Sortierung
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={sortKey}
              className={selectClassName}
            >
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="outline" size="sm">
            Anwenden
          </Button>
        </form>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {q?.trim()
                ? "Keine Anfragen gefunden."
                : filter
                  ? "Keine Anfragen mit diesem Status."
                  : "Noch keine Anfragen vorhanden."}
            </p>
            {!filter && !q?.trim() && (
              <Button
                variant="outline"
                render={<Link href="/change-requests/new" />}
              >
                Erste Idee einreichen
              </Button>
            )}
          </div>
        ) : isBoardView ? (
          <KanbanBoard requests={requests} />
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request) => (
              <Link
                key={request.id}
                href={`/change-requests/${request.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {request.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Eingereicht am{" "}
                    {new Date(request.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <StatusBadge status={request.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
