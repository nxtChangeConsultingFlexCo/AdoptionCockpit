"use client";

import { useState, useTransition } from "react";
import { setMyManager } from "@/app/settings/team/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OrgMemberOption {
  id: string;
  name: string;
}

const selectClassName =
  "flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function ManagerSelect({
  members,
  currentParentId,
}: {
  members: OrgMemberOption[];
  currentParentId: string | null;
}) {
  const [selected, setSelected] = useState(currentParentId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await setMyManager(selected === "" ? null : selected);
      if (res.error) {
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
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={selectClassName}
        >
          <option value="">Keine Zuordnung</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending || selected === (currentParentId ?? "")}
        >
          {isPending ? "Wird gespeichert…" : "Speichern"}
        </Button>
      </div>
    </div>
  );
}
