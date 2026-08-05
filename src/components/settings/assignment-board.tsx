"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAssignment, deleteAssignment } from "@/app/settings/assignments/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";

// Team-Board bildet ausschließlich die operative Berichtskette ab
// (Mitarbeiter:in -> Cluster Lead). Gremien-Mitgliedschaft (CA Board/
// IT Board/Steering Committee) ist flache, mehrfach mögliche
// Zugehörigkeit ohne Parent-Kette - siehe GremienMatrix daneben.
const BOARD_ROLES: AppRole[] = ["leader"];
const UNASSIGNED = "__unassigned__";

export interface BoardMember {
  id: string;
  name: string;
  roles: AppRole[];
}

interface BoardTarget {
  id: string;
  name: string;
}

const selectClassName =
  "h-6 w-full rounded-md border border-input bg-transparent px-1 text-[11px] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

function PersonCard({
  member,
  allTargets,
  currentTarget,
  isPending,
  onMove,
}: {
  member: BoardMember;
  allTargets: BoardTarget[];
  currentTarget: string;
  isPending: boolean;
  onMove: (childId: string, target: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", member.id)}
      className="flex cursor-grab flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm active:cursor-grabbing"
    >
      <span className="font-medium text-foreground">{member.name}</span>
      {member.roles.length > 0 && (
        <span className="text-[11px] text-muted-foreground">
          {member.roles.map((r) => APP_ROLE_LABELS[r]).join(", ")}
        </span>
      )}
      <select
        value={currentTarget}
        onChange={(e) => onMove(member.id, e.target.value)}
        disabled={isPending}
        className={selectClassName}
      >
        {allTargets
          .filter((t) => t.id !== member.id)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
      </select>
    </div>
  );
}

function DropZone({
  dropKey,
  target,
  activeKey,
  onDragOverKey,
  onLeaveKey,
  onDrop,
  children,
}: {
  dropKey: string;
  target: string;
  activeKey: string | null;
  onDragOverKey: (key: string) => void;
  onLeaveKey: (key: string) => void;
  onDrop: (e: React.DragEvent, target: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverKey(dropKey);
      }}
      onDragLeave={() => onLeaveKey(dropKey)}
      onDrop={(e) => onDrop(e, target)}
      className={`flex flex-col gap-2 rounded-lg p-2 transition-colors ${
        activeKey === dropKey ? "bg-primary/10 ring-2 ring-primary/40" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function AssignmentBoard({
  members,
  assignments,
}: {
  members: BoardMember[];
  assignments: Record<string, string>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const headers = useMemo(
    () =>
      BOARD_ROLES.map((role) => ({
        role,
        people: members.filter((m) => m.roles.includes(role)),
      })),
    [members],
  );

  const headerIds = useMemo(
    () => new Set(headers.flatMap((h) => h.people.map((p) => p.id))),
    [headers],
  );

  function reportsOf(parentId: string) {
    return members.filter(
      (m) => assignments[m.id] === parentId && !headerIds.has(m.id),
    );
  }

  const placedIds = new Set<string>([
    ...headers.flatMap((h) => h.people.map((p) => p.id)),
    ...headers.flatMap((h) => h.people.flatMap((p) => reportsOf(p.id).map((r) => r.id))),
  ]);
  const unassigned = members.filter((m) => !placedIds.has(m.id));

  function applyMove(childId: string, target: string) {
    setError(null);
    startTransition(async () => {
      const res =
        target === UNASSIGNED
          ? await deleteAssignment(childId)
          : await setAssignment(childId, target);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDrop(e: React.DragEvent, target: string) {
    e.preventDefault();
    setDragOverKey(null);
    const childId = e.dataTransfer.getData("text/plain");
    if (!childId || childId === target) return;
    applyMove(childId, target);
  }

  const allTargets: BoardTarget[] = [
    { id: UNASSIGNED, name: "Keine Zuordnung" },
    ...headers.flatMap((h) => h.people.map((p) => ({ id: p.id, name: p.name }))),
  ];

  function onDragOverKey(key: string) {
    setDragOverKey(key);
  }
  function onLeaveKey(key: string) {
    setDragOverKey((k) => (k === key ? null : k));
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <p className="text-xs text-muted-foreground">
        Mitarbeitende auf die Karte ihres Cluster Leads ziehen, oder das
        Dropdown auf der Karte nutzen.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            Nicht zugeordnet
          </h3>
          <DropZone
            dropKey={UNASSIGNED}
            target={UNASSIGNED}
            activeKey={dragOverKey}
            onDragOverKey={onDragOverKey}
            onLeaveKey={onLeaveKey}
            onDrop={handleDrop}
          >
            {unassigned.length === 0 ? (
              <p className="text-xs text-muted-foreground">—</p>
            ) : (
              unassigned.map((m) => (
                <PersonCard
                  key={m.id}
                  member={m}
                  allTargets={allTargets}
                  currentTarget={assignments[m.id] ?? UNASSIGNED}
                  isPending={isPending}
                  onMove={applyMove}
                />
              ))
            )}
          </DropZone>
        </div>

        {headers.map(({ role, people }) => (
          <div key={role} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {APP_ROLE_LABELS[role]}
            </h3>
            {people.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Niemand in dieser Rolle.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {people.map((headerPerson) => (
                  <div
                    key={headerPerson.id}
                    className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-2"
                  >
                    <PersonCard
                      member={headerPerson}
                      allTargets={allTargets}
                      currentTarget={assignments[headerPerson.id] ?? UNASSIGNED}
                      isPending={isPending}
                      onMove={applyMove}
                    />
                    <DropZone
                      dropKey={`${role}-${headerPerson.id}`}
                      target={headerPerson.id}
                      activeKey={dragOverKey}
                      onDragOverKey={onDragOverKey}
                      onLeaveKey={onLeaveKey}
                      onDrop={handleDrop}
                    >
                      <div className="ml-3 flex flex-col gap-2 border-l border-border pl-3">
                        {reportsOf(headerPerson.id).length === 0 ? (
                          <p className="text-[11px] text-muted-foreground">
                            Noch niemand zugeordnet
                          </p>
                        ) : (
                          reportsOf(headerPerson.id).map((r) => (
                            <PersonCard
                              key={r.id}
                              member={r}
                              allTargets={allTargets}
                              currentTarget={assignments[r.id] ?? UNASSIGNED}
                              isPending={isPending}
                              onMove={applyMove}
                            />
                          ))
                        )}
                      </div>
                    </DropZone>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
