"use client";

import { useState, useTransition } from "react";
import { createAssignment, deleteAssignment } from "@/app/settings/assignments/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ORG_ASSIGNMENT_RELATION_TYPES,
  ORG_ASSIGNMENT_RELATION_LABELS,
  type OrgAssignmentRelationType,
} from "@/types/org-assignment";

interface OrgMemberOption {
  id: string;
  name: string;
}

interface AssignmentListItem {
  childUserId: string;
  childName: string;
  parentName: string;
  relationType: OrgAssignmentRelationType;
}

const selectClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function AssignmentManager({
  members,
  assignments,
}: {
  members: OrgMemberOption[];
  assignments: AssignmentListItem[];
}) {
  const [childId, setChildId] = useState("");
  const [parentId, setParentId] = useState("");
  const [relationType, setRelationType] =
    useState<OrgAssignmentRelationType>("reports_to");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    if (!childId || !parentId) {
      setError("Bitte beide Personen auswählen.");
      return;
    }
    startTransition(async () => {
      const res = await createAssignment(childId, parentId, relationType);
      if (res.error) {
        setError(res.error);
        return;
      }
      setChildId("");
      setParentId("");
    });
  }

  function handleDelete(childUserId: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteAssignment(childUserId);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Person</span>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Auswählen…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Beziehung</span>
          <select
            value={relationType}
            onChange={(e) =>
              setRelationType(e.target.value as OrgAssignmentRelationType)
            }
            className={selectClassName}
          >
            {ORG_ASSIGNMENT_RELATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {ORG_ASSIGNMENT_RELATION_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Zugeordnet zu</span>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className={selectClassName}
          >
            <option value="">Auswählen…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button size="sm" onClick={handleCreate} disabled={isPending}>
            Zuordnen
          </Button>
        </div>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine Zuordnungen vorhanden.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {assignments.map((a) => (
            <div
              key={a.childUserId}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="text-foreground">
                  {a.childName} <span className="text-muted-foreground">→</span>{" "}
                  {a.parentName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ORG_ASSIGNMENT_RELATION_LABELS[a.relationType]}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => handleDelete(a.childUserId)}
              >
                Entfernen
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
