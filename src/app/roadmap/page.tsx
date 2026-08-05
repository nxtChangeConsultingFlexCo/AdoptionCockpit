import Link from "next/link";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { RoadmapTabs } from "@/components/roadmap-tabs";
import { StatusBadge } from "@/components/change-requests/status-badge";
import type { ChangeRequestRow, ChangeRequestStatus } from "@/types/governance";

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

export default async function RoadmapPage() {
  await requireUser("/roadmap");
  const supabase = await createClient();

  // RLS ("Org members can view relevant change requests" /
  // "God can view all change requests") beschränkt das Ergebnis bereits
  // korrekt: Board-Rollen sehen die ganze Org, andere nur eigene bzw.
  // ihnen zugewiesene Anfragen.
  const { data } = await supabase
    .from("change_requests")
    .select("*")
    .in("status", PLANNABLE_STATUSES)
    .order("target_date", { ascending: true, nullsFirst: false });

  const requests = (data ?? []) as ChangeRequestRow[];

  const phases = new Map<string, ChangeRequestRow[]>();
  for (const request of requests) {
    const key = request.phase ?? NO_PHASE_LABEL;
    const group = phases.get(key) ?? [];
    group.push(request);
    phases.set(key, group);
  }

  function earliestTargetDate(group: ChangeRequestRow[]): string {
    const dates = group.map((r) => r.target_date).filter(Boolean) as string[];
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
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Roadmap
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Eure Change-Roadmap
          </h1>
        </div>

        <div className="mt-6">
          <RoadmapTabs />
        </div>

        {requests.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Noch nichts eingeplant. Qualifizierte Anfragen erscheinen hier,
              sobald das CA Board eine Phase und ein Zieldatum festgelegt hat.
            </p>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-10">
            {orderedPhases.map(([phase, items]) => (
              <section key={phase} className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {phase}
                </h2>
                <div className="flex flex-col gap-3">
                  {items.map((request) => {
                    const targetDate = formatDate(request.target_date);
                    return (
                      <Link
                        key={request.id}
                        href={`/change-requests/${request.id}`}
                        className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">
                            {request.title}
                          </span>
                          {targetDate && (
                            <span className="text-xs text-muted-foreground">
                              Zieldatum: {targetDate}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={request.status} />
                      </Link>
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
