"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";

export interface AssignmentActionResult {
  error?: string;
}

// Für das Drag & Drop-Board: immer die generische Beziehung
// ('reports_to') - relation_type wird nirgends für Zugriffslogik
// ausgewertet (nur is_ancestor_of()'s parent_user_id-Kette zählt),
// insofern reicht hier ein einziger, generischer Wert statt der
// typisierten Varianten aus der alten Formular-UI.
export async function setAssignment(
  childUserId: string,
  parentUserId: string,
): Promise<AssignmentActionResult> {
  const currentUser = await requireRole(["client_admin"], "/settings/assignments");
  if (childUserId === parentUserId) {
    return { error: "Eine Person kann sich nicht selbst zugeordnet werden." };
  }

  const supabase = await createClient();

  // Zielorganisation aus dem Profil der Kind-Person ableiten statt aus
  // currentUser.organizationId - funktioniert so auch für god (keine
  // eigene Org) und verhindert, dass ein manipulierter Client eine
  // falsche organization_id unterschiebt. RLS prüft die eigentliche
  // Berechtigung ohnehin serverseitig erneut.
  const { data: childProfile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", childUserId)
    .maybeSingle();

  if (!childProfile?.organization_id) {
    return { error: "Person ist keiner Organisation zugeordnet." };
  }
  if (
    currentUser.role !== "god" &&
    childProfile.organization_id !== currentUser.organizationId
  ) {
    return { error: "Keine Berechtigung." };
  }

  const { error } = await supabase.from("org_assignments").upsert(
    {
      child_user_id: childUserId,
      parent_user_id: parentUserId,
      relation_type: "reports_to",
      organization_id: childProfile.organization_id,
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
