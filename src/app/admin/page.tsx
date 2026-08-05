import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/cockpit/kpi-card";
import {
  CHANGE_REQUEST_STATUSES,
  CHANGE_REQUEST_STATUS_LABELS,
  type ChangeRequestStatus,
} from "@/types/governance";

interface RecentUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

function countBy(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

const OPEN_CHANGE_REQUEST_STATUSES: ChangeRequestStatus[] = [
  "draft",
  "submitted",
  "cab_review",
  "qualified",
  "it_backlog",
  "in_implementation",
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { data: recentUsersData } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  const recentUsers = (recentUsersData ?? []) as RecentUser[];

  const { count: totalAssessments } = await supabase
    .from("assessments")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  const { data: assessmentTemplateData } = await supabase
    .from("assessments")
    .select("assessment_templates(title)")
    .eq("status", "completed");

  const templateCounts = new Map<string, number>();
  for (const row of (assessmentTemplateData ?? []) as unknown as {
    assessment_templates: { title: string } | null;
  }[]) {
    const title = row.assessment_templates?.title ?? "Unbekanntes Template";
    templateCounts.set(title, (templateCounts.get(title) ?? 0) + 1);
  }

  const { data: changeRequestData } = await supabase
    .from("change_requests")
    .select("status");

  const statusCounts = countBy(
    (changeRequestData ?? []).map((r) => r.status as string),
  );
  const openChangeRequests = OPEN_CHANGE_REQUEST_STATUSES.reduce(
    (sum, status) => sum + (statusCounts[status] ?? 0),
    0,
  );

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Admin
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard
            label="Registrierte Nutzer:innen"
            value={`${totalUsers ?? 0}`}
          />
          <KpiCard
            label="Abgeschlossene Assessments"
            value={`${totalAssessments ?? 0}`}
          />
          <KpiCard
            label="Offene Change Requests"
            value={`${openChangeRequests}`}
          />
        </div>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-foreground">
              Assessments je Template
            </h2>
            {templateCounts.size === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine abgeschlossenen Assessments.
              </p>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                {[...templateCounts.entries()].map(([title, count]) => (
                  <div
                    key={title}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">{title}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-foreground">
              Change Requests nach Status
            </h2>
            {Object.keys(statusCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Change Requests.
              </p>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                {CHANGE_REQUEST_STATUSES.filter((status) => statusCounts[status]).map(
                  (status) => (
                    <div
                      key={status}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">
                        {CHANGE_REQUEST_STATUS_LABELS[status]}
                      </span>
                      <span className="font-medium text-foreground">
                        {statusCounts[status]}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-foreground">
            Zuletzt registriert
          </h2>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Registrierungen.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">E-Mail</th>
                      <th className="px-4 py-3">Registriert am</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {[user.first_name, user.last_name]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
