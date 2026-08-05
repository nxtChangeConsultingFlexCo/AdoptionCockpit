"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";
import type { OrgAssignmentRelationType } from "@/types/org-assignment";

export interface AssignmentActionResult {
  error?: string;
}

export async function createAssignment(
  childUserId: string,
  parentUserId: string,
  relationType: OrgAssignmentRelationType,
): Promise<AssignmentActionResult> {
  const currentUser = await requireRole(["client_admin"], "/settings/assignments");
  if (!currentUser.organizationId) {
    return { error: "Keiner Organisation zugeordnet." };
  }
  if (childUserId === parentUserId) {
    return { error: "Eine Person kann sich nicht selbst zugeordnet werden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("org_assignments").upsert(
    {
      child_user_id: childUserId,
      parent_user_id: parentUserId,
      relation_type: relationType,
      organization_id: currentUser.organizationId,
    },
    { onConflict: "child_user_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/settings/assignments");
  return {};
}

export async function deleteAssignment(
  childUserId: string,
): Promise<AssignmentActionResult> {
  await requireRole(["client_admin"], "/settings/assignments");
  const supabase = await createClient();

  const { error } = await supabase
    .from("org_assignments")
    .delete()
    .eq("child_user_id", childUserId);

  if (error) return { error: error.message };

  revalidatePath("/settings/assignments");
  return {};
}
