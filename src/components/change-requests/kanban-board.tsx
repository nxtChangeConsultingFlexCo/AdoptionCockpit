import Link from "next/link";
import {
  CHANGE_REQUEST_STATUSES,
  CHANGE_REQUEST_STATUS_LABELS,
  type ChangeRequestRow,
} from "@/types/governance";

interface KanbanBoardProps {
  requests: ChangeRequestRow[];
}

// Reine Lese-Ansicht: Statusänderungen laufen ausschließlich über die
// sorgfältig rollen-/status-gegatete BoardActions-Logik auf der
// Detailseite - hier bewusst kein Drag-and-Drop, um diese Prüfungen nicht
// zu umgehen oder zu duplizieren.
export function KanbanBoard({ requests }: KanbanBoardProps) {
  const columns = CHANGE_REQUEST_STATUSES.map((status) => ({
    status,
    items: requests.filter((r) => r.status === status),
  }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => (
        <div key={column.status} className="flex w-64 shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-foreground">
              {CHANGE_REQUEST_STATUS_LABELS[column.status]}
            </h3>
            <span className="text-xs text-muted-foreground">{column.items.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {column.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                Keine Anfragen
              </div>
            ) : (
              column.items.map((request) => (
                <Link
                  key={request.id}
                  href={`/change-requests/${request.id}`}
                  className="flex flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40"
                >
                  <span className="font-medium text-foreground">{request.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
