"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentScopeType } from "@/types/template";

export interface OrgAssessmentActionResult {
  error?: string;
}

// RLS ("Client admins can manage their organization's assessment
// catalog") prüft organization_id/client_admin ohnehin serverseitig
// erneut - organizationId wird hier nur zur Identifikation der Zeile
// gebraucht, nicht als Vertrauensgrundlage.
export async function setAssessmentAvailability(
  organizationId: string,
  templateId: string,
  isAvailable: boolean,
): Promise<OrgAssessmentActionResult> {
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("organization_assessments")
    .update({ is_available: isAvailable })
    .eq("organization_id", organizationId)
    .eq("template_id", templateId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung, diesen Check zu ändern." };
  }

  revalidatePath("/settings/assessments");
  revalidatePath("/");
  return {};
}

// RLS prüft organization_id/client_admin erneut serverseitig - hier
// nur eine leichte Vorab-Validierung der Scope-Kombination.
export async function setAssessmentScope(
  organizationId: string,
  templateId: string,
  scopeType: AssessmentScopeType,
  roleList: string[],
  userIds: string[],
): Promise<OrgAssessmentActionResult> {
  if (scopeType === "roles" && roleList.length === 0) {
    return { error: "Bitte mindestens eine Rolle auswählen." };
  }
  if (scopeType === "users" && userIds.length === 0) {
    return { error: "Bitte mindestens eine Person auswählen." };
  }

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("organization_assessments")
    .update({
      scope_type: scopeType,
      role_list: scopeType === "roles" ? roleList : [],
      user_ids: scopeType === "users" ? userIds : [],
    })
    .eq("organization_id", organizationId)
    .eq("template_id", templateId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung, diesen Check zu ändern." };
  }

  revalidatePath("/settings/assessments");
  revalidatePath("/");
  return {};
}
