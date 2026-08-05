"use client";

import { useState, useTransition } from "react";
import { setRoadmapFields } from "@/app/change-requests/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RoadmapFieldsForm({
  requestId,
  initialPhase,
  initialTargetDate,
}: {
  requestId: string;
  initialPhase: string | null;
  initialTargetDate: string | null;
}) {
  const [phase, setPhase] = useState(initialPhase ?? "");
  const [targetDate, setTargetDate] = useState(initialTargetDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await setRoadmapFields(requestId, phase, targetDate);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">Roadmap-Planung</p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>Roadmap-Planung gespeichert.</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phase">Phase</Label>
          <Input
            id="phase"
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            placeholder="z. B. Q1 2025"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="target_date">Zieldatum</Label>
          <Input
            id="target_date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button disabled={isPending} onClick={handleSave}>
            {isPending ? "Wird gespeichert…" : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
}
