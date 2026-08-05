"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  forwardToCab,
  decideCabReview,
  updateItBoardStatus,
  type ChangeRequestActionResult,
} from "@/app/change-requests/actions";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ChangeRequestStatus } from "@/types/governance";
import type { AppRole } from "@/types/roles";

const textareaClassName =
  "flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface BoardActionsProps {
  requestId: string;
  status: ChangeRequestStatus;
  orgRoles: AppRole[];
  isGod: boolean;
}

export function BoardActions({ requestId, status, orgRoles, isGod }: BoardActionsProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ChangeRequestActionResult>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  // Rollen sind mehrfach kombinierbar - ein Nutzer kann gleichzeitig
  // Leader und CAB-Mitglied sein. Der aktuelle Status ist aber immer
  // eindeutig, daher greift trotzdem höchstens einer der drei Blöcke.
  const canForwardToCab = (isGod || orgRoles.includes("leader")) && status === "submitted";
  const canDecideAsCab =
    (isGod || orgRoles.includes("cab_member")) && status === "cab_review";
  const canUpdateAsItBoard =
    (isGod || orgRoles.includes("it_board")) &&
    (status === "it_backlog" || status === "in_implementation");

  if (canForwardToCab) {
    return (
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          Als Cluster Lead kannst du diese Anfrage an das Change Advisory
          Board weiterleiten.
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          className="self-start"
          disabled={isPending}
          onClick={() => run(() => forwardToCab(requestId))}
        >
          {isPending ? "Wird weitergeleitet…" : "An CAB weiterleiten"}
        </Button>
      </div>
    );
  }

  if (canDecideAsCab) {
    return (
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <label className="text-sm font-medium text-foreground" htmlFor="cab-note">
          Begründung (optional)
        </label>
        <textarea
          id="cab-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Kurze Begründung für die Entscheidung"
          className={textareaClassName}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-3">
          <Button
            disabled={isPending}
            onClick={() => run(() => decideCabReview(requestId, "qualified", note))}
          >
            Qualifizieren
          </Button>
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => run(() => decideCabReview(requestId, "rejected", note))}
          >
            Ablehnen
          </Button>
        </div>
      </div>
    );
  }

  if (canUpdateAsItBoard) {
    return (
      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <label className="text-sm font-medium text-foreground" htmlFor="it-feedback">
          Feedback (optional)
        </label>
        <textarea
          id="it-feedback"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Status-Update oder Rückmeldung an den Cluster Lead"
          className={textareaClassName}
        />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex gap-3">
          {status === "it_backlog" && (
            <Button
              disabled={isPending}
              onClick={() =>
                run(() => updateItBoardStatus(requestId, "in_implementation", note))
              }
            >
              In Umsetzung nehmen
            </Button>
          )}
          {status === "in_implementation" && (
            <Button
              disabled={isPending}
              onClick={() => run(() => updateItBoardStatus(requestId, "done", note))}
            >
              Als abgeschlossen markieren
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
