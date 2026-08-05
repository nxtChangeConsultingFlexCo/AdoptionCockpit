"use client";

import { useState, useTransition } from "react";
import {
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
} from "@/app/roadmap/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ROADMAP_ITEM_STATUSES,
  ROADMAP_ITEM_STATUS_LABELS,
  type RoadmapItemStatus,
} from "@/types/roadmap";

const textareaClassName =
  "flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface RoadmapItemFormProps {
  itemId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialPhase?: string;
  initialTargetDate?: string;
  initialStatus?: RoadmapItemStatus;
  triggerLabel: string;
  triggerVariant?: "default" | "outline" | "ghost";
}

export function RoadmapItemForm({
  itemId,
  initialTitle = "",
  initialDescription = "",
  initialPhase = "",
  initialTargetDate = "",
  initialStatus = "planned",
  triggerLabel,
  triggerVariant = "outline",
}: RoadmapItemFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [phase, setPhase] = useState(initialPhase);
  const [targetDate, setTargetDate] = useState(initialTargetDate);
  const [status, setStatus] = useState<RoadmapItemStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(itemId);
  const domId = itemId ?? "new";

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = isEdit
        ? await updateRoadmapItem(itemId!, title, description, phase, targetDate, status)
        : await createRoadmapItem(title, description, phase, targetDate, status);
      if (res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
      if (!isEdit) {
        setTitle("");
        setDescription("");
        setPhase("");
        setTargetDate("");
        setStatus("planned");
      }
    });
  }

  function handleDelete() {
    if (!itemId) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteRoadmapItem(itemId);
      if (res.error) {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <Button variant={triggerVariant} size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`title-${domId}`}>Titel</Label>
        <Input id={`title-${domId}`} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`description-${domId}`}>Beschreibung (optional)</Label>
        <textarea
          id={`description-${domId}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={textareaClassName}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`phase-${domId}`}>Phase</Label>
          <Input
            id={`phase-${domId}`}
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            placeholder="z. B. Q1 2026"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`target_date-${domId}`}>Zieldatum</Label>
          <Input
            id={`target_date-${domId}`}
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`status-${domId}`}>Status</Label>
          <select
            id={`status-${domId}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as RoadmapItemStatus)}
            className={selectClassName}
          >
            {ROADMAP_ITEM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ROADMAP_ITEM_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" disabled={isPending} onClick={handleSave}>
          {isPending ? "Wird gespeichert…" : "Speichern"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          Abbrechen
        </Button>
        {isEdit && (
          <Button
            variant="destructive"
            size="sm"
            className="ml-auto"
            disabled={isPending}
            onClick={handleDelete}
          >
            Löschen
          </Button>
        )}
      </div>
    </div>
  );
}
