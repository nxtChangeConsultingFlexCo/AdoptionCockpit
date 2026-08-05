"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";

export interface CockpitKpiActionResult {
  error?: string;
}

// Autorisierung passiert in set_cockpit_kpi_visibility() selbst
// (SECURITY DEFINER) - requireRole hier nur, um unangemeldete/falsche
// Rollen erst gar nicht bis zum RPC-Aufruf durchzulassen.
export async function updateCockpitKpiVisibility(
  organizationId: string,
  role: string,
  kpiIds: string[],
): Promise<CockpitKpiActionResult> {
  await requireRole(["client_admin"], "/settings/cockpit");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_cockpit_kpi_visibility", {
    p_organization_id: organizationId,
    p_role: role,
    p_kpi_ids: kpiIds,
  });

  if (error) return { error: error.message };

  revalidatePath("/settings/cockpit");
  revalidatePath("/cockpit");
  return {};
}
