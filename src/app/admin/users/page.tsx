import Link from "next/link";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ASSIGNABLE_ORG_ROLES, APP_ROLE_LABELS, type AppRole } from "@/types/roles";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Ohne Filter wird bewusst nur eine kleine, aktuelle Auswahl geladen statt
// aller Nutzer:innen über alle Organisationen hinweg (kann bei wachsender
// Plattform schnell groß werden) - sobald mindestens ein Filter gesetzt
// ist, gilt ein großzügigeres Limit.
const DEFAULT_LIMIT = 25;
const FILTERED_LIMIT = 200;

const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    organizationId?: string;
    role?: string;
    status?: string;
  }>;
}) {
  const currentUser = await requireRole(["god"], "/admin/users");
  const supabase = await createClient();
  const { q, organizationId, role, status } = await searchParams;
  const roleFilter =
    role && (ASSIGNABLE_ORG_ROLES as readonly string[]).includes(role)
      ? (role as AppRole)
      : undefined;
  const statusFilter = status === "active" || status === "blocked" ? status : undefined;
  const hasFilter = Boolean(q?.trim() || organizationId || roleFilter || statusFilter);

  // profile_roles nur als !inner-Join laden, wenn tatsächlich nach einer
  // Rolle gefiltert wird - sonst würden Nutzer:innen ganz ohne Org-Rolle
  // fälschlich aus dem Ergebnis fallen.
  let query = supabase
    .from("profiles")
    .select(
      roleFilter
        ? "id, first_name, last_name, email, job_title, role, organization_id, created_at, is_blocked, organizations(name), profile_roles!inner(role)"
        : "id, first_name, last_name, email, job_title, role, organization_id, created_at, is_blocked, organizations(name), profile_roles(role)",
    )
    .order("created_at", { ascending: false })
    .limit(hasFilter ? FILTERED_LIMIT : DEFAULT_LIMIT);

  if (q?.trim()) {
    const term = q.trim().replace(/[%,]/g, "");
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }
  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }
  if (roleFilter) {
    query = query.eq("profile_roles.role", roleFilter);
  }
  if (statusFilter) {
    query = query.eq("is_blocked", statusFilter === "blocked");
  }

  const { data, error } = await query;
  const users = (data ?? []) as unknown as UserListItem[];

  const { count: totalCount } = hasFilter
    ? { count: null }
    : await supabase.from("profiles").select("id", { count: "exact", head: true });

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

        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 flex-col gap-1 sm:max-w-xs">
            <label htmlFor="q" className="text-xs text-muted-foreground">
              Suche
            </label>
            <Input id="q" name="q" defaultValue={q ?? ""} placeholder="Name oder E-Mail…" />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="organizationId" className="text-xs text-muted-foreground">
              Organisation
            </label>
            <select
              id="organizationId"
              name="organizationId"
              defaultValue={organizationId ?? ""}
              className={selectClassName}
            >
              <option value="">Alle Organisationen</option>
              {(organizations ?? []).map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-xs text-muted-foreground">
              Rolle
            </label>
            <select
              id="role"
              name="role"
              defaultValue={roleFilter ?? ""}
              className={selectClassName}
            >
              <option value="">Alle Rollen</option>
              {ASSIGNABLE_ORG_ROLES.map((r) => (
                <option key={r} value={r}>
                  {APP_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="status" className="text-xs text-muted-foreground">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={statusFilter ?? ""}
              className={selectClassName}
            >
              <option value="">Alle</option>
              <option value="active">Aktiv</option>
              <option value="blocked">Gesperrt</option>
            </select>
          </div>
          <Button type="submit" variant="outline" size="sm">
            Filtern
          </Button>
          {hasFilter && (
            <Button type="button" variant="ghost" size="sm" render={<Link href="/admin/users" />}>
              Zurücksetzen
            </Button>
          )}
        </form>

        <p className="text-sm text-muted-foreground">
          {hasFilter
            ? `${users.length} Ergebnis${users.length === 1 ? "" : "se"}`
            : `Zeige die ${users.length} zuletzt registrierten Nutzer:innen${
                totalCount ? ` von insgesamt ${totalCount}` : ""
              } – nutze die Filter, um gezielt zu suchen.`}
        </p>

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
          <InvitationList invitations={invitationList} showOrg />
        </div>
      </div>
    </div>
  );
}
