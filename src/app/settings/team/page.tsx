import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ManagerSelect } from "@/components/settings/manager-select";

interface ProfileSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

function displayName(profile: ProfileSummary): string {
  return (
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email ||
    "Unbekannt"
  );
}

export default async function TeamPage() {
  const currentUser = await requireUser("/settings/team");
  const supabase = await createClient();

  if (!currentUser.organizationId) {
    return (
      <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <div className="w-full max-w-2xl">
          <p className="text-sm text-muted-foreground">
            Du bist aktuell keiner Organisation zugeordnet.
          </p>
        </div>
      </div>
    );
  }

  const { data: memberRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("organization_id", currentUser.organizationId)
    .neq("id", currentUser.id)
    .order("first_name", { ascending: true });

  const members = ((memberRows ?? []) as ProfileSummary[]).map((m) => ({
    id: m.id,
    name: displayName(m),
  }));

  const { data: assignmentRow } = await supabase
    .from("org_assignments")
    .select("parent_user_id")
    .eq("child_user_id", currentUser.id)
    .maybeSingle();

  const { data: reportRows } = await supabase
    .from("org_assignments")
    .select("child_user_id")
    .eq("parent_user_id", currentUser.id);

  const reportIds = (reportRows ?? []).map((r) => r.child_user_id as string);
  const reports = members.filter((m) => reportIds.includes(m.id));

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-10">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Nutzer
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Mein Team
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lege fest, wem du zugeordnet bist. Das bestimmt, wer deine
            Check-Ergebnisse einsehen kann.
          </p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-foreground">
            Meine Zuordnung
          </h2>
          <ManagerSelect
            members={members}
            currentParentId={assignmentRow?.parent_user_id ?? null}
          />
        </section>

        <section className="flex flex-col gap-3 border-t border-border pt-8">
          <h2 className="text-lg font-medium text-foreground">
            Mir zugeordnet ({reports.length})
          </h2>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aktuell ist dir niemand zugeordnet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
                >
                  {report.name}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
