"use client";

import { useState, useTransition } from "react";
import { createInvitation } from "@/app/settings/invitations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSIGNABLE_ORG_ROLES, APP_ROLE_LABELS, type AppRole } from "@/types/roles";

const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface InvitationFormProps {
  // god: Auswahl unter allen Organisationen. client_admin: keine Auswahl,
  // immer die eigene Organisation (lockedOrganizationId).
  organizations?: { id: string; name: string }[];
  lockedOrganizationId?: string;
}

export function InvitationForm({
  organizations,
  lockedOrganizationId,
}: InvitationFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("employee");
  const [organizationId, setOrganizationId] = useState(
    lockedOrganizationId ?? organizations?.[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setInviteLink(null);
    if (!organizationId) {
      setError("Bitte wähle eine Organisation aus.");
      return;
    }
    startTransition(async () => {
      const res = await createInvitation(email, role, organizationId);
      if (res.error || !res.token) {
        setError(res.error ?? "Etwas ist schiefgelaufen.");
        return;
      }
      setInviteLink(`${window.location.origin}/register?invite=${res.token}`);
      setEmail("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Neue Einladung erstellen</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {organizations && organizations.length === 0 && (
          <Alert>
            <AlertDescription>
              Es existiert noch keine Organisation, der du jemanden zuordnen
              könntest.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {inviteLink && (
          <Alert>
            <AlertDescription className="flex flex-col gap-2">
              <span>Einladungslink erstellt – bitte manuell versenden:</span>
              <code className="break-all rounded bg-muted px-2 py-1 text-xs">
                {inviteLink}
              </code>
            </AlertDescription>
          </Alert>
        )}
        <div className={`grid gap-4 ${organizations ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite_email">E-Mail</Label>
            <Input
              id="invite_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite_role">Rolle</Label>
            <select
              id="invite_role"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className={selectClassName}
            >
              {ASSIGNABLE_ORG_ROLES.map((r) => (
                <option key={r} value={r}>
                  {APP_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          {organizations && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite_org">Organisation</Label>
              <select
                id="invite_org"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className={selectClassName}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isPending || (organizations !== undefined && organizations.length === 0)}
          className="self-start"
        >
          {isPending ? "Wird erstellt…" : "Einladung erstellen"}
        </Button>
      </CardContent>
    </Card>
  );
}
