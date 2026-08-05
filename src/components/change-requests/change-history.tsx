import {
  CHANGE_REQUEST_STATUS_LABELS,
  CHANGE_REQUEST_PRIORITY_LABELS,
  type ChangeRequestStatus,
  type ChangeRequestPriority,
} from "@/types/governance";

const FIELD_LABELS: Record<string, string> = {
  title: "Titel",
  description: "Beschreibung",
  priority: "Priorität",
  status: "Status",
  cab_decision_note: "CA-Board-Begründung",
  it_feedback: "IT-Feedback",
  phase: "Roadmap-Phase",
  target_date: "Zieldatum",
};

export interface ChangeHistoryEvent {
  id: string;
  changed_at: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by_name: string;
}

function formatValue(field: string, value: string | null): string {
  if (value === null || value === "") return "—";
  if (field === "status") {
    return CHANGE_REQUEST_STATUS_LABELS[value as ChangeRequestStatus] ?? value;
  }
  if (field === "priority") {
    return CHANGE_REQUEST_PRIORITY_LABELS[value as ChangeRequestPriority] ?? value;
  }
  if (field === "target_date") {
    return new Date(value).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
  return value.length > 120 ? `${value.slice(0, 120)}…` : value;
}

export function ChangeHistory({ events }: { events: ChangeHistoryEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Änderungen protokolliert.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex flex-col gap-0.5 border-l-2 border-border pl-3 text-sm"
        >
          <span className="text-foreground">
            <span className="font-medium">{FIELD_LABELS[event.field] ?? event.field}</span>{" "}
            geändert: {formatValue(event.field, event.old_value)} →{" "}
            {formatValue(event.field, event.new_value)}
          </span>
          <span className="text-xs text-muted-foreground">
            {event.changed_by_name} ·{" "}
            {new Date(event.changed_at).toLocaleString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ol>
  );
}
