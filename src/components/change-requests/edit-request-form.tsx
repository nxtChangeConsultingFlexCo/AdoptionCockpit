"use client";

import { useState, useTransition } from "react";
import { updateChangeRequestFields } from "@/app/change-requests/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CHANGE_REQUEST_PRIORITY_LABELS,
  type ChangeRequestPriority,
} from "@/types/governance";

const textareaClassName =
  "flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function EditRequestForm({
  requestId,
  initialTitle,
  initialDescription,
  initialPriority,
}: {
  requestId: string;
  initialTitle: string;
  initialDescription: string;
  initialPriority: ChangeRequestPriority | null;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [priority, setPriority] = useState(initialPriority ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateChangeRequestFields(
        requestId,
        title,
        description,
        priority,
      );
      if (res.error) {
        setError(res.error);
        return;
      }
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        Bearbeiten
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
        <Label htmlFor="edit_title">Titel</Label>
        <Input id="edit_title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit_description">Beschreibung</Label>
        <textarea
          id="edit_description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={textareaClassName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit_priority">Priorität</Label>
        <select
          id="edit_priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={selectClassName}
        >
          <option value="">Keine Angabe</option>
          {(Object.keys(CHANGE_REQUEST_PRIORITY_LABELS) as ChangeRequestPriority[]).map(
            (p) => (
              <option key={p} value={p}>
                {CHANGE_REQUEST_PRIORITY_LABELS[p]}
              </option>
            ),
          )}
        </select>
      </div>
      <div className="flex gap-3">
        <Button size="sm" disabled={isPending} onClick={handleSave}>
          {isPending ? "Wird gespeichert…" : "Speichern"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            setEditing(false);
            setTitle(initialTitle);
            setDescription(initialDescription);
            setPriority(initialPriority ?? "");
            setError(null);
          }}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
