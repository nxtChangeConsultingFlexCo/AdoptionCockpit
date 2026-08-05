export const ORG_ASSIGNMENT_RELATION_TYPES = [
  "reports_to",
  "leader_employee",
  "ca_board_leader",
  "steering_ca_board",
  "it_board_steering",
] as const;

export type OrgAssignmentRelationType = (typeof ORG_ASSIGNMENT_RELATION_TYPES)[number];

export const ORG_ASSIGNMENT_RELATION_LABELS: Record<OrgAssignmentRelationType, string> = {
  reports_to: "Zugeordnet zu",
  leader_employee: "Mitarbeiter → Leader",
  ca_board_leader: "Leader → CA Board",
  steering_ca_board: "CA Board → Steering Committee",
  it_board_steering: "Steering Committee → IT Board",
};

export interface OrgAssignmentRow {
  child_user_id: string;
  parent_user_id: string;
  organization_id: string;
  relation_type: OrgAssignmentRelationType;
  created_at: string;
}
