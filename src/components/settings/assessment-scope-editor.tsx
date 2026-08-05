"use client";

import { useState, useTransition } from "react";
import { setAssessmentScope } from "@/app/settings/assessments/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ASSIGNABLE_ORG_ROLES, APP_ROLE_LABELS } from "@/types/roles";
import type { AssessmentScopeType } from "@/types/template";

interface OrgMemberOption {
  id: string;
  name: string;
}

const SCOPE_LABELS: Record<AssessmentScopeType, string> = {
  org: "Ganze Organisation",
  roles: "Bestimmte Rollen",
  users: "Bestimmte Personen",
};

const scopeButtonClassName = (active: boolean) =>
  `rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-input text-muted-foreground hover:text-foreground"
  }`;

export function AssessmentScopeEditor({
  organizationId,
  templateId,
  initialScopeType,
  initialRoleList,
  initialUserIds,
  members,
}: {
  organizationId: string;
  templateId: string;
  initialScopeType: AssessmentScopeType;
  initialRoleList: string[];
  initialUserIds: string[];
  members: OrgMemberOption[];
}) {
  const [open, setOpen] = useState(false);
  const [scopeType, setScopeType] = useState<AssessmentScopeType>(initialScopeType);
  const [roleList, setRoleList] = useState<string[]>(initialRoleList);
  const [userIds, setUserIds] = useState<string[]>(initialUserIds);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleRole(role: string, checked: boolean) {
    setRoleList((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role),
    );
  }

  function toggleUser(id: string, checked: boolean) {
    setUserIds((prev) => (checked ? [...prev, id] : prev.filter((u) => u !== id)));
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await setAssessmentScope(
        organizationId,
        templateId,
        scopeType,
        roleList,
        userIds,
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  const summary =
    scopeType === "org"
      ? SCOPE_LABELS.org
      : scopeType === "roles"
        ? roleList.length > 0
          ? roleList.map((r) => APP_ROLE_LABELS[r as keyof typeof APP_ROLE_LABELS] ?? r).join(", ")
          : "Keine Rolle ausgewählt"
        : userIds.length > 0
          ? `${userIds.length} Person${userIds.length === 1 ? "" : "en"}`
          : "Keine Person ausgewählt";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="text-left text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Freigabe: {summary}
      </button>

      {open && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {(["org", "roles", "users"] as AssessmentScopeType[]).map((type) => (
              <button
                key={type}
                type="button"
                className={scopeButtonClassName(scopeType === type)}
                onClick={() => setScopeType(type)}
              >
                {SCOPE_LABELS[type]}
              </button>
            ))}
          </div>

          {scopeType === "roles" && (
            <div className="flex flex-wrap gap-3">
              {ASSIGNABLE_ORG_ROLES.map((role) => (
                <label key={role} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={roleList.includes(role)}
                    onCheckedChange={(checked) => toggleRole(role, checked === true)}
                  />
                  {APP_ROLE_LABELS[role]}
                </label>
              ))}
            </div>
          )}

          {scopeType === "users" && (
            <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto">
              {members.map((member) => (
                <label key={member.id} className="flex items-center gap-1.5 text-xs">
                  <Checkbox
                    checked={userIds.includes(member.id)}
                    onCheckedChange={(checked) => toggleUser(member.id, checked === true)}
                  />
                  {member.name}
                </label>
              ))}
              {members.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  Keine weiteren Personen in der Organisation.
                </span>
              )}
            </div>
          )}

          <Button size="sm" className="self-start" disabled={isPending} onClick={handleSave}>
            {isPending ? "Wird gespeichert…" : "Freigabe speichern"}
          </Button>
        </div>
      )}
    </div>
  );
}
