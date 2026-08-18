export const PROGRAM_STATUSES = ["active", "paused", "done", "archived"] as const;

export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  done: "Abgeschlossen",
  archived: "Archiviert",
};

export interface ProgramRow {
  id: string;
  organization_id: string;
  name: string;
  goal: string | null;
  status: ProgramStatus;
  start_date: string | null;
  target_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const PROJECT_STATUSES = [
  "planned",
  "active",
  "on_hold",
  "done",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "Geplant",
  active: "Aktiv",
  on_hold: "Pausiert",
  done: "Abgeschlossen",
  cancelled: "Abgebrochen",
};

export interface ProjectRow {
  id: string;
  organization_id: string;
  program_id: string | null;
  name: string;
  goal: string | null;
  status: ProjectStatus;
  phase: string | null;
  start_date: string | null;
  target_date: string | null;
  lead: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemberRow {
  id: string;
  project_id: string;
  user_id: string;
  added_by: string | null;
  created_at: string;
}
