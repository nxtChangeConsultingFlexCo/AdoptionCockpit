import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  UserManagementTable,
  type UserListItem,
} from "@/components/settings/user-management-table";
import { APP_ROLES, ASSIGNABLE_ORG_ROLES } from "@/types/roles";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default async function UserManagementPage() {
  const currentUser = await requireRole(["client_admin", "god"], "/settings/users");
  const supabase = await createClient();
  const isGod = currentUser.role === "god";

  let query = supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, job_title, role, organization_id, created_at, organizations(name)",
    )
    .order("created_at", { ascending: true });

  if (!isGod) {
    query = query.eq("organization_id", currentUser.organizationId ?? "");
  }

  const { data, error } = await query;
  const users = (data ?? []) as unknown as UserListItem[];

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
            {isGod
              ? "Alle Nutzer:innen über alle Organisationen hinweg."
              : "Weise Mitarbeitenden deiner Organisation eine Rolle im Change-Prozess zu."}
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
          availableRoles={isGod ? [...APP_ROLES] : ASSIGNABLE_ORG_ROLES}
          showOrg={isGod}
        />
      </div>
    </div>
  );
}
