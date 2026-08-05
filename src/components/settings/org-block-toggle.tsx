"use client";

import { useState, useTransition } from "react";
import { setOrgBlocked } from "@/app/admin/organizations/actions";
import { Button } from "@/components/ui/button";

export function OrgBlockToggle({
  orgId,
  orgName,
  isBlocked,
}: {
  orgId: string;
  orgName: string;
  isBlocked: boolean;
}) {
  const [blocked, setBlocked] = useState(isBlocked);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !blocked;
    if (next) {
      const confirmed = window.confirm(
        `${orgName} wirklich sperren? Alle Mitglieder werden abgemeldet.`,
      );
      if (!confirmed) return;
    }

    setError(null);
    const previous = blocked;
    setBlocked(next);
    startTransition(async () => {
      const res = await setOrgBlocked(orgId, next);
      if (res.error) {
        setBlocked(previous);
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={blocked ? "outline" : "destructive"}
        size="sm"
        disabled={isPending}
        onClick={handleClick}
      >
        {blocked ? "Entsperren" : "Sperren"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
