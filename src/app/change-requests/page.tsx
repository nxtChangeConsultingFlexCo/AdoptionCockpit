import Link from "next/link";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RoadmapTabs } from "@/components/roadmap-tabs";
import { StatusBadge } from "@/components/change-requests/status-badge";
import type { ChangeRequestRow, ChangeRequestStatus } from "@/types/governance";

const STATUS_FILTERS: Record<string, { label: string; statuses: ChangeRequestStatus[] }> = {
  submitted: { label: "Unbehandelt", statuses: ["submitted"] },
  in_progress: {
    label: "In Behandlung",
    statuses: ["cab_review", "qualified", "it_backlog", "in_implementation"],
  },
  done: { label: "Erledigt", statuses: ["done"] },
};

export default async function ChangeRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser("/change-requests");
  const { status } = await searchParams;
  const filter = status ? STATUS_FILTERS[status] : undefined;
  const supabase = await createClient();

  let query = supabase
    .from("change_requests")
    .select(
      "id, title, description, status, priority, created_at, updated_at, requested_by, assigned_leader, organization_id, cab_decision_note, it_feedback",
    )
    .order("created_at", { ascending: false });

  if (filter) {
    query = query.in("status", filter.statuses);
  }

  const { data } = await query;

  const requests = (data ?? []) as ChangeRequestRow[];

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

        <RoadmapTabs />

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
          <Button render={<Link href="/change-requests/new" />}>
            Neue Idee einreichen
          </Button>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {filter
                ? "Keine Anfragen mit diesem Status."
                : "Noch keine Anfragen vorhanden."}
            </p>
            {!filter && (
              <Button
                variant="outline"
                render={<Link href="/change-requests/new" />}
              >
                Erste Idee einreichen
              </Button>
            )}
          </div>
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
