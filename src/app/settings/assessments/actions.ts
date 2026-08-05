"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
