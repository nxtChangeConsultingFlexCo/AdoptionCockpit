import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AssignmentManager } from "@/components/settings/assignment-manager";
import type { OrgAssignmentRelationType } from "@/types/org-assignment";

interface ProfileSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface AssignmentRow {
  child_user_id: string;
  parent_user_id: string;
  relation_type: OrgAssignmentRelationType;
}

function displayName(profile: ProfileSummary | undefined): string {
  if (!profile) return "Unbekannt";
  return (
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email ||
    "Unbekannt"
  );
}

export default async function AssignmentsPage() {
  const currentUser = await requireRole(["client_admin"], "/settings/assignments");
  const supabase = await createClient();

  const { data: memberRows } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .eq("organization_id", currentUser.organizationId ?? "")
    .order("first_name", { ascending: true });

  const profiles = (memberRows ?? []) as ProfileSummary[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const members = profiles.map((p) => ({ id: p.id, name: displayName(p) }));

  const { data: assignmentRows } = await supabase
    .from("org_assignments")
    .select("child_user_id, parent_user_id, relation_type")
    .eq("organization_id", currentUser.organizationId ?? "");

  const assignments = ((assignmentRows ?? []) as AssignmentRow[]).map((a) => ({
    childUserId: a.child_user_id,
    childName: displayName(profileMap.get(a.child_user_id)),
    parentName: displayName(profileMap.get(a.parent_user_id)),
    relationType: a.relation_type,
  }));

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Einstellungen
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Zuordnungen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lege fest, wer wem in deiner Organisation zugeordnet ist. Das
            steuert, wer wessen Check-Ergebnisse einsehen darf.
          </p>
        </div>

        <AssignmentManager members={members} assignments={assignments} />
      </div>
    </div>
  );
}
