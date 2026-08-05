import Link from "next/link";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { RoadmapTabs } from "@/components/roadmap-tabs";
import { RoadmapItemForm } from "@/components/roadmap-item-form";
import { StatusBadge } from "@/components/change-requests/status-badge";
import type { ChangeRequestRow, ChangeRequestStatus } from "@/types/governance";
import {
  ROADMAP_ITEM_STATUS_LABELS,
  type RoadmapItemRow,
} from "@/types/roadmap";

const NO_PHASE_LABEL = "Noch nicht eingeplant";

// Plan zeigt nur, was das CA Board bereits qualifiziert hat - der Rest
// läuft in der Pipeline unter dem Anfragen-Tab.
const PLANNABLE_STATUSES: ChangeRequestStatus[] = [
  "qualified",
  "it_backlog",
  "in_implementation",
  "done",
];

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface PlanEntry {
  id: string;
  title: string;
  phase: string | null;
  targetDate: string | null;
  origin: "manual" | "request";
  requestStatus?: ChangeRequestStatus;
  roadmapItem?: RoadmapItemRow;
}

export default async function RoadmapPage() {
  const user = await requireUser("/roadmap");
  const supabase = await createClient();
  const canManage =
    user.role === "god" ||
    user.orgRoles.includes("client_admin") ||
    user.orgRoles.includes("ca_board");

  // RLS beschränkt beide Abfragen bereits korrekt: Board-Rollen sehen
  // die ganze Org, andere nur eigene/zugewiesene Anfragen bzw. die
  // org-weit lesbaren manuellen Roadmap-Einträge.
  const [{ data: requestData }, { data: itemData }] = await Promise.all([
    supabase
      .from("change_requests")
      .select("*")
      .in("status", PLANNABLE_STATUSES),
    supabase.from("roadmap_items").select("*"),
  ]);

  const requests = (requestData ?? []) as ChangeRequestRow[];
  const items = (itemData ?? []) as RoadmapItemRow[];

  const entries: PlanEntry[] = [
    ...requests.map((r) => ({
      id: `request-${r.id}`,
      title: r.title,
      phase: r.phase,
      targetDate: r.target_date,
      origin: "request" as const,
      requestStatus: r.status,
    })),
    ...items.map((item) => ({
      id: `item-${item.id}`,
      title: item.title,
      phase: item.phase,
      targetDate: item.target_date,
      origin: "manual" as const,
      roadmapItem: item,
    })),
  ];

  const phases = new Map<string, PlanEntry[]>();
  for (const entry of entries) {
    const key = entry.phase ?? NO_PHASE_LABEL;
    const group = phases.get(key) ?? [];
    group.push(entry);
    phases.set(key, group);
  }

  function earliestTargetDate(group: PlanEntry[]): string {
    const dates = group.map((e) => e.targetDate).filter(Boolean) as string[];
    return dates.length > 0 ? dates.sort()[0]! : "9999-99-99";
  }

  const orderedPhases = Array.from(phases.entries())
    .filter(([phase]) => phase !== NO_PHASE_LABEL)
    .sort((a, b) => earliestTargetDate(a[1]).localeCompare(earliestTargetDate(b[1])));

  if (phases.has(NO_PHASE_LABEL)) {
    orderedPhases.push([NO_PHASE_LABEL, phases.get(NO_PHASE_LABEL)!]);
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Roadmap
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Eure Change-Roadmap
            </h1>
          </div>
          {canManage && (
            <RoadmapItemForm triggerLabel="Eintrag hinzufügen" triggerVariant="default" />
          )}
        </div>

        <div className="mt-6">
          <RoadmapTabs />
        </div>

        {entries.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Noch nichts eingeplant. Qualifizierte Anfragen erscheinen hier,
              sobald das CA Board eine Phase und ein Zieldatum festgelegt
              hat{canManage ? " - oder legt direkt einen Eintrag an." : "."}
            </p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-10">
            {orderedPhases.map(([phase, phaseEntries]) => (
              <section key={phase} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {phase}
                </h2>
                <div className="flex flex-col gap-3">
                  {phaseEntries.map((entry) => {
                    const targetDate = formatDate(entry.targetDate);

                    if (entry.origin === "request") {
                      return (
                        <Link
                          key={entry.id}
                          href={`/change-requests/${entry.id.replace("request-", "")}`}
                          className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">
                              {entry.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Aus Anfrage
                              {targetDate ? ` · Zieldatum: ${targetDate}` : ""}
                            </span>
                          </div>
                          <StatusBadge status={entry.requestStatus!} />
                        </Link>
                      );
                    }

                    const item = entry.roadmapItem!;
                    return (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-foreground">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Manuell
                              {targetDate ? ` · Zieldatum: ${targetDate}` : ""}
                            </span>
                            {item.description && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                            {ROADMAP_ITEM_STATUS_LABELS[item.status]}
                          </span>
                        </div>
                        {canManage && (
                          <RoadmapItemForm
                            itemId={item.id}
                            initialTitle={item.title}
                            initialDescription={item.description ?? ""}
                            initialPhase={item.phase ?? ""}
                            initialTargetDate={item.target_date ?? ""}
                            initialStatus={item.status}
                            triggerLabel="Bearbeiten"
                            triggerVariant="ghost"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
