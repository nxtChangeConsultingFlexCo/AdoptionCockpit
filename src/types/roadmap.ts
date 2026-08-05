export const ROADMAP_ITEM_STATUSES = ["planned", "in_progress", "done"] as const;

export type RoadmapItemStatus = (typeof ROADMAP_ITEM_STATUSES)[number];

export const ROADMAP_ITEM_STATUS_LABELS: Record<RoadmapItemStatus, string> = {
  planned: "Geplant",
  in_progress: "In Arbeit",
  done: "Erledigt",
};

export interface RoadmapItemRow {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  phase: string | null;
  target_date: string | null;
  status: RoadmapItemStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
