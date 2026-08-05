export interface OrganizationRow {
  id: string;
  created_at: string;
  name: string;
}

export const CHANGE_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "cab_review",
  "qualified",
  "it_backlog",
  "in_implementation",
  "done",
  "rejected",
] as const;

export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  draft: "Entwurf",
  submitted: "Eingereicht",
  cab_review: "CAB-Prüfung",
  qualified: "Qualifiziert",
  it_backlog: "IT-Backlog",
  in_implementation: "In Umsetzung",
  done: "Abgeschlossen",
  rejected: "Abgelehnt",
};

export type ChangeRequestPriority = "low" | "medium" | "high";

export const CHANGE_REQUEST_PRIORITY_LABELS: Record<ChangeRequestPriority, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
};

export interface ChangeRequestRow {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  requested_by: string | null;
  assigned_leader: string | null;
  status: ChangeRequestStatus;
  cab_decision_note: string | null;
  it_feedback: string | null;
  priority: ChangeRequestPriority | null;
  created_at: string;
  updated_at: string;
}
