"use client";

import { useState, useTransition } from "react";
import {
  toggleUserRole,
  updatePlatformRole,
  setUserBlocked,
} from "@/app/settings/users/actions";
import { startImpersonation } from "@/app/impersonate/actions";
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLATFORM_ROLE_LABELS: Record<"employee" | "consultant" | "god", string> = {
  employee: "Standard",
  consultant: APP_ROLE_LABELS.consultant,
  god: APP_ROLE_LABELS.god,
};

export interface UserListItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  job_title: string | null;
  role: AppRole;
  organization_id: string | null;
  created_at: string;
  is_blocked: boolean;
  organizations: { name: string } | null;
  profile_roles: { role: AppRole }[] | null;
}

interface UserManagementTableProps {
  users: UserListItem[];
  currentUserId: string;
  assignableOrgRoles: AppRole[];
  showOrg: boolean;
  isGod: boolean;
}

export function UserManagementTable({
  users,
  currentUserId,
  assignableOrgRoles,
  showOrg,
  isGod,
}: UserManagementTableProps) {
  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Keine Nutzer:innen gefunden.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">E-Mail</th>
              <th className="px-4 py-3">Funktion</th>
              {showOrg && <th className="px-4 py-3">Organisation</th>}
              <th className="px-4 py-3">Rollen</th>
              {isGod && <th className="px-4 py-3">Plattform</th>}
              <th className="px-4 py-3">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isOwnRow={user.id === currentUserId}
                assignableOrgRoles={assignableOrgRoles}
                showOrg={showOrg}
                isGod={isGod}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({
  user,
  isOwnRow,
  assignableOrgRoles,
  showOrg,
  isGod,
}: {
  user: UserListItem;
  isOwnRow: boolean;
  assignableOrgRoles: AppRole[];
  showOrg: boolean;
  isGod: boolean;
}) {
  const [roles, setRoles] = useState<AppRole[]>(
    (user.profile_roles ?? []).map((r) => r.role),
  );
  const [platformRole, setPlatformRole] = useState(user.role);
  const [error, setError] = useState<string | null>(null);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(user.is_blocked);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isImpersonating, startImpersonateTransition] = useTransition();
  const [isBlockPending, startBlockTransition] = useTransition();

  function handleImpersonate() {
    setImpersonateError(null);
    startImpersonateTransition(async () => {
      const res = await startImpersonation(user.id);
      if (res?.error) {
        setImpersonateError(res.error);
      }
    });
  }

  function handleToggleBlocked() {
    const next = !isBlocked;
    // Bei client_admin (nicht god) wird eine Rückfrage verlangt, wenn
    // die Zielperson selbst client_admin ist - siehe Anforderung.
    if (
      next &&
      !isGod &&
      (user.profile_roles ?? []).some((r) => r.role === "client_admin")
    ) {
      const confirmed = window.confirm(
        `${fullName} ist selbst Organisations-Admin. Wirklich sperren?`,
      );
      if (!confirmed) return;
    }

    setBlockError(null);
    const previous = isBlocked;
    setIsBlocked(next);
    startBlockTransition(async () => {
      const res = await setUserBlocked(user.id, next);
      if (res.error) {
        setIsBlocked(previous);
        setBlockError(res.error);
      }
    });
  }

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";

  function handleRoleToggle(role: AppRole, checked: boolean) {
    const previous = roles;
    setRoles((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role),
    );
    setError(null);
    startTransition(async () => {
      const res = await toggleUserRole(user.id, role, checked);
      if (res.error) {
        setRoles(previous);
        setError(res.error);
      }
    });
  }

  function handlePlatformRoleChange(value: AppRole | null) {
    if (!value) return;
    const nextRole = value as "employee" | "consultant" | "god";
    const previous = platformRole;
    setPlatformRole(nextRole);
    setError(null);
    startTransition(async () => {
      const res = await updatePlatformRole(user.id, nextRole);
      if (res.error) {
        setPlatformRole(previous);
        setError(res.error);
      }
    });
  }

  const isPlatformUser = user.role === "god" || user.role === "consultant";

  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="px-4 py-3 text-foreground">
        <div className="flex items-center gap-2">
          {fullName}
          {isBlocked && (
            <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              Gesperrt
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{user.email ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.job_title ?? "—"}</td>
      {showOrg && (
        <td className="px-4 py-3 text-muted-foreground">
          {user.organizations?.name ?? "—"}
        </td>
      )}
      <td className="px-4 py-3">
        {isPlatformUser ? (
          <span className="text-xs text-muted-foreground">
            Plattformrolle – keine Org-Rollen
          </span>
        ) : (
          <div className="flex flex-col gap-1.5">
            {assignableOrgRoles.map((role) => (
              <label key={role} className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={roles.includes(role)}
                  onCheckedChange={(checked) =>
                    handleRoleToggle(role, checked === true)
                  }
                  disabled={isPending}
                />
                {APP_ROLE_LABELS[role]}
              </label>
            ))}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </td>
      {isGod && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Select
              value={platformRole}
              onValueChange={handlePlatformRoleChange}
              disabled={isOwnRow || isPending}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue>
                  {(value: "employee" | "consultant" | "god") =>
                    PLATFORM_ROLE_LABELS[value] ?? value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Standard</SelectItem>
                <SelectItem value="consultant">
                  {APP_ROLE_LABELS.consultant}
                </SelectItem>
                <SelectItem value="god">{APP_ROLE_LABELS.god}</SelectItem>
              </SelectContent>
            </Select>
            {isOwnRow && (
              <span className="text-xs text-muted-foreground">(du)</span>
            )}
          </div>
        </td>
      )}
      <td className="px-4 py-3">
        {!isOwnRow && (
          <div className="flex flex-col items-start gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={isImpersonating}
              onClick={handleImpersonate}
            >
              Als diesen User ansehen
            </Button>
            {impersonateError && (
              <p className="text-xs text-destructive">{impersonateError}</p>
            )}
            <Button
              variant={isBlocked ? "outline" : "destructive"}
              size="sm"
              disabled={isBlockPending}
              onClick={handleToggleBlocked}
            >
              {isBlocked ? "Entsperren" : "Sperren"}
            </Button>
            {blockError && (
              <p className="text-xs text-destructive">{blockError}</p>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
