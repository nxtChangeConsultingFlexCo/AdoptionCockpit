import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AssignmentBoard, type BoardMember } from "@/components/settings/assignment-board";
import { OrgPicker } from "@/components/settings/org-picker";
import type { AppRole } from "@/types/roles";

interface ProfileWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  profile_roles: { role: AppRole }[] | null;
}

function displayName(profile: ProfileWithRoles): string {
  return (
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email ||
    "Unbekannt"
  );
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const currentUser = await requireRole(["client_admin"], "/settings/assignments");
  const { org } = await searchParams;
  const supabase = await createClient();
  const isGod = currentUser.role === "god";

  let organizationId = isGod ? (org ?? null) : currentUser.organizationId;
  let organizations: { id: string; name: string }[] = [];

  if (isGod) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name", { ascending: true });
    organizations = data ?? [];
    if (!organizationId && organizations.length > 0) {
      organizationId = organizations[0]!.id;
    }
  }

  let members: BoardMember[] = [];
  let assignments: Record<string, string> = {};

  if (organizationId) {
    const { data: memberRows } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, profile_roles(role)")
      .eq("organization_id", organizationId)
      .order("first_name", { ascending: true });

    members = ((memberRows ?? []) as ProfileWithRoles[]).map((p) => ({
      id: p.id,
      name: displayName(p),
      roles: (p.profile_roles ?? []).map((r) => r.role),
    }));

    const { data: assignmentRows } = await supabase
      .from("org_assignments")
      .select("child_user_id, parent_user_id")
      .eq("organization_id", organizationId);

    assignments = Object.fromEntries(
      (assignmentRows ?? []).map((a) => [a.child_user_id, a.parent_user_id]),
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Einstellungen
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              Zuordnungen
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ziehe Personen auf ihre Leader, CA Board-, Steering
              Committee- oder IT Board-Zugehörigkeit. Das steuert, wer
              wessen Check-Ergebnisse einsehen darf.
            </p>
          </div>
          {isGod && (
            <OrgPicker organizations={organizations} selected={organizationId} />
          )}
        </div>

        {!organizationId ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            Keine Organisation ausgewählt.
          </div>
        ) : (
          <AssignmentBoard members={members} assignments={assignments} />
        )}
      </div>
    </div>
  );
}
