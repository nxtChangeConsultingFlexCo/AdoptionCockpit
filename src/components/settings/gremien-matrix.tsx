"use client";

import { useState, useTransition } from "react";
import { toggleUserRole } from "@/app/settings/users/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";
import type { BoardMember } from "@/components/settings/assignment-board";

// Flache Mitgliedschaft, keine Parent-Kette: eine Person kann
// gleichzeitig in mehreren Gremien sein. Läuft über profile_roles
// (dieselbe Datenquelle wie in der Nutzerverwaltung), hier nur als
// kompakte Matrix statt einzelner Checkboxen pro Nutzer:in-Zeile.
const GREMIEN_ROLES: AppRole[] = ["ca_board", "it_board", "steering_committee"];

export function GremienMatrix({ members }: { members: BoardMember[] }) {
  const [rolesByMember, setRolesByMember] = useState<Record<string, AppRole[]>>(
    Object.fromEntries(members.map((m) => [m.id, m.roles])),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(memberId: string, role: AppRole, checked: boolean) {
    const previous = rolesByMember[memberId] ?? [];
    const next = checked ? [...previous, role] : previous.filter((r) => r !== role);

    setRolesByMember((prev) => ({ ...prev, [memberId]: next }));
    setError(null);
    startTransition(async () => {
      const res = await toggleUserRole(memberId, role, checked);
      if (res.error) {
        setRolesByMember((prev) => ({ ...prev, [memberId]: previous }));
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3">Person</th>
                {GREMIEN_ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 text-center">
                    {APP_ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">{member.name}</td>
                  {GREMIEN_ROLES.map((role) => (
                    <td key={role} className="px-4 py-3 text-center">
                      <Checkbox
                        checked={rolesByMember[member.id]?.includes(role) ?? false}
                        disabled={isPending}
                        onCheckedChange={(checked) =>
                          toggle(member.id, role, checked === true)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td
                    colSpan={GREMIEN_ROLES.length + 1}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    Keine Personen in dieser Organisation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
