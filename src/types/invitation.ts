import type { AppRole } from "./roles";

export type InvitationStatus = "pending" | "accepted";

export interface InvitationRow {
  id: string;
  email: string;
  role: AppRole;
  organization_id: string;
  token: string;
  status: InvitationStatus;
  invited_by: string | null;
  created_at: string;
  accepted_at: string | null;
}
