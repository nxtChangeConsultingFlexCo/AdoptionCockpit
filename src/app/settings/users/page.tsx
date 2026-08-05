import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  UserManagementTable,
  type UserListItem,
} from "@/components/settings/user-management-table";
import { InvitationForm } from "@/components/settings/invitation-form";
import {
  InvitationList,
  type InvitationListItem,
} from "@/components/settings/invitation-list";
import { ASSIGNABLE_ORG_ROLES } from "@/types/roles";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function UserManagementPage() {
  // god verwaltet Nutzer organisationsübergreifend unter /admin/users -
  // diese Seite ist die org-gebundene Ansicht für client_admin.
  const currentUser = await requireRole(["client_admin"], "/settings/users");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, job_title, role, organization_id, created_at, is_blocked, organizations(name), profile_roles(role)",
    )
    .eq("organization_id", currentUser.organizationId ?? "")
    // god ist organisationsunabhängig und käme hier ohnehin nie vor.
    // consultant ist bewusst NICHT ausgeschlossen - Consultants sind
    // kundenspezifisch zugeordnet, ein client_admin soll den/die eigene(n)
    // Consultant sehen (nur god darf ihn zuweisen/entfernen).
    .neq("role", "god")
    .order("created_at", { ascending: true });

  const users = (data ?? []) as unknown as UserListItem[];

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, email, role, status")
    .eq("organization_id", currentUser.organizationId ?? "")
    .order("created_at", { ascending: false });

  const invitationList = (invitations ?? []) as unknown as InvitationListItem[];

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Einstellungen
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Benutzerverwaltung
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Weise Mitarbeitenden deiner Organisation eine Rolle im
            Change-Prozess zu.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <UserManagementTable
          users={users}
          currentUserId={currentUser.id}
          assignableOrgRoles={ASSIGNABLE_ORG_ROLES}
          showOrg={false}
          isGod={false}
        />

        <div className="flex flex-col gap-4 border-t border-border pt-8">
          <h2 className="text-lg font-medium text-foreground">Einladungen</h2>
          <InvitationForm lockedOrganizationId={currentUser.organizationId ?? undefined} />
          <InvitationList invitations={invitationList} showOrg={false} />
        </div>
      </div>
    </div>
  );
}
