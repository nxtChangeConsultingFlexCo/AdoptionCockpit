"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/settings/users/actions";
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export interface UserListItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  job_title: string | null;
  role: AppRole;
  organization_id: string | null;
  created_at: string;
  organizations: { name: string } | null;
}

interface UserManagementTableProps {
  users: UserListItem[];
  currentUserId: string;
  availableRoles: AppRole[];
  showOrg: boolean;
}

export function UserManagementTable({
  users,
  currentUserId,
  availableRoles,
  showOrg,
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
              <th className="px-4 py-3">Rolle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isOwnRow={user.id === currentUserId}
                availableRoles={availableRoles}
                showOrg={showOrg}
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
  availableRoles,
  showOrg,
}: {
  user: UserListItem;
  isOwnRow: boolean;
  availableRoles: AppRole[];
  showOrg: boolean;
}) {
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "—";

  function handleChange(value: AppRole | null) {
    if (!value) return;
    const nextRole = value;
    const previousRole = role;
    setRole(nextRole);
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateUserRole(user.id, nextRole);
      if (res.error) {
        setRole(previousRole);
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3 text-foreground">{fullName}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.email ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{user.job_title ?? "—"}</td>
      {showOrg && (
        <td className="px-4 py-3 text-muted-foreground">
          {user.organizations?.name ?? "—"}
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Select
            value={role}
            onValueChange={handleChange}
            disabled={isOwnRow || isPending}
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {APP_ROLE_LABELS[r]}
                </SelectItem>
              ))}
              {!availableRoles.includes(role) && (
                <SelectItem value={role}>{APP_ROLE_LABELS[role]}</SelectItem>
              )}
            </SelectContent>
          </Select>
          {isOwnRow ? (
            <span className="text-xs text-muted-foreground">(du)</span>
          ) : (
            saved &&
            !isPending && <span className="text-xs text-primary">Gespeichert</span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </td>
    </tr>
  );
}
