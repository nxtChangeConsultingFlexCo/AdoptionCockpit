import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  UserManagementTable,
  type UserListItem,
} from "@/components/settings/user-management-table";
import { InvitationForm } from "@/components/settings/invitation-form";
import { APP_ROLES, APP_ROLE_LABELS, ASSIGNABLE_ORG_ROLES } from "@/types/roles";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface InvitationListItem {
  id: string;
  email: string;
  role: (typeof APP_ROLES)[number];
  status: "pending" | "accepted";
  organizations: { name: string } | null;
}

export default async function AdminUsersPage() {
  const currentUser = await requireRole(["god"], "/admin/users");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, job_title, role, organization_id, created_at, is_blocked, organizations(name), profile_roles(role)",
    )
    .order("created_at", { ascending: true });

  const users = (data ?? []) as unknown as UserListItem[];

  const { data: invitations } = await supabase
    .from("invitations")
    .select("id, email, role, status, organizations(name)")
    .order("created_at", { ascending: false });

  const invitationList = (invitations ?? []) as unknown as InvitationListItem[];

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Admin
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Nutzer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Nutzer:innen über alle Organisationen hinweg.
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
          showOrg
          isGod
        />

        <div className="flex flex-col gap-4 border-t border-border pt-8">
          <h2 className="text-lg font-medium text-foreground">Einladungen</h2>
          <InvitationForm organizations={organizations ?? []} />

          {invitationList.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3">E-Mail</th>
                      <th className="px-4 py-3">Rolle</th>
                      <th className="px-4 py-3">Organisation</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationList.map((invitation) => (
                      <tr
                        key={invitation.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {invitation.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {APP_ROLE_LABELS[invitation.role]}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {invitation.organizations?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              invitation.status === "accepted"
                                ? "inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                                : "inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            }
                          >
                            {invitation.status === "accepted"
                              ? "Angenommen"
                              : "Ausstehend"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
