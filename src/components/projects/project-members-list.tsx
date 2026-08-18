"use client";

import { useState, useTransition } from "react";
import { addProjectMember, removeProjectMember } from "@/app/projects/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MemberEntry {
  id: string;
  name: string;
  isMember: boolean;
}

// Checkliste statt Diff-and-Save-Formular: jede Zeile wirkt sofort
// (add/remove direkt bei Klick), analog zu den bestehenden
// Ein-Klick-Aktionen im Change-Request-Workflow (z.B. forwardToCab)
// statt eines separaten "Speichern"-Schritts.
export function ProjectMembersList({
  projectId,
  members,
}: {
  projectId: string;
  members: MemberEntry[];
}) {
  const [memberState, setMemberState] = useState(
    new Map(members.map((m) => [m.id, m.isMember])),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(userId: string, next: boolean) {
    setError(null);
    startTransition(async () => {
      const res = next
        ? await addProjectMember(projectId, userId)
        : await removeProjectMember(projectId, userId);
      if (res.error) {
        setError(res.error);
        return;
      }
      setMemberState((prev) => new Map(prev).set(userId, next));
    });
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine weiteren Org-Mitglieder vorhanden.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1">
        {members.map((member) => (
          <label
            key={member.id}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/40"
          >
            <input
              type="checkbox"
              checked={memberState.get(member.id) ?? false}
              disabled={isPending}
              onChange={(e) => toggle(member.id, e.target.checked)}
              className="size-4 rounded border-input"
            />
            {member.name}
          </label>
        ))}
      </div>
    </div>
  );
}
