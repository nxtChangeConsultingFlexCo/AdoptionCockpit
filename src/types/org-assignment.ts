export type OrgAssignmentRelationType = "reports_to";

export interface OrgAssignmentRow {
  child_user_id: string;
  parent_user_id: string;
  organization_id: string;
  relation_type: OrgAssignmentRelationType;
  created_at: string;
}
