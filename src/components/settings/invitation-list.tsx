"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { revokeInvitation } from "@/app/settings/invitations/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";

export type InvitationStatus = "pending" | "accepted" | "revoked";

export interface InvitationListItem {
  id: string;
  email: string;
  role: AppRole;
  status: InvitationStatus;
  organizations?: { name: string } | null;
}

const STATUS_STYLES: Record<InvitationStatus, string> = {
  pending: "bg-primary/10 text-primary",
  accepted: "bg-muted text-foreground",
  revoked: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: "Ausstehend",
  accepted: "Angenommen",
  revoked: "Zurückgezogen",
};

export function InvitationList({
  invitations,
  showOrg,
}: {
  invitations: InvitationListItem[];
  showOrg: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRevoke(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await revokeInvitation(id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  if (invitations.length === 0) return null;

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
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Rolle</th>
                {showOrg && <th className="px-4 py-3">Organisation</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
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
                  {showOrg && (
                    <td className="px-4 py-3 text-muted-foreground">
                      {invitation.organizations?.name ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[invitation.status]}`}
                    >
                      {STATUS_LABELS[invitation.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {invitation.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleRevoke(invitation.id)}
                      >
                        Zurückziehen
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
