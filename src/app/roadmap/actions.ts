"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, type AuthenticatedUser } from "@/lib/auth/roles";
import type { RoadmapItemStatus } from "@/types/roadmap";

export interface RoadmapItemActionResult {
  error?: string;
}

// RLS ("Client admins and CA board can manage roadmap items") ist die
// eigentliche Grenze und prüft dasselbe serverseitig erneut - hier nur
// für eine frühe, freundliche Fehlermeldung.
function canManageRoadmapItems(user: AuthenticatedUser): boolean {
  return (
    user.role === "god" ||
    user.orgRoles.includes("client_admin") ||
    user.orgRoles.includes("ca_board")
  );
}

export async function createRoadmapItem(
  title: string,
  description: string,
  phase: string,
  targetDate: string,
  status: RoadmapItemStatus,
): Promise<RoadmapItemActionResult> {
  const user = await requireUser("/roadmap");
  if (!canManageRoadmapItems(user)) {
    return { error: "Keine Berechtigung, Roadmap-Einträge anzulegen." };
  }
  if (!user.organizationId) {
    return { error: "Keiner Organisation zugeordnet." };
  }
  if (!title.trim()) {
    return { error: "Titel darf nicht leer sein." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("roadmap_items").insert({
    organization_id: user.organizationId,
    title: title.trim(),
    description: description.trim() || null,
    phase: phase.trim() || null,
    target_date: targetDate || null,
    status,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/roadmap");
  return {};
}

export async function updateRoadmapItem(
  id: string,
  title: string,
  description: string,
  phase: string,
  targetDate: string,
  status: RoadmapItemStatus,
): Promise<RoadmapItemActionResult> {
  const user = await requireUser("/roadmap");
  if (!canManageRoadmapItems(user)) {
    return { error: "Keine Berechtigung, diesen Eintrag zu bearbeiten." };
  }
  if (!title.trim()) {
    return { error: "Titel darf nicht leer sein." };
  }

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("roadmap_items")
    .update({
      title: title.trim(),
      description: description.trim() || null,
      phase: phase.trim() || null,
      target_date: targetDate || null,
      status,
    })
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  revalidatePath("/roadmap");
  return {};
}

export async function deleteRoadmapItem(
  id: string,
): Promise<RoadmapItemActionResult> {
  const user = await requireUser("/roadmap");
  if (!canManageRoadmapItems(user)) {
    return { error: "Keine Berechtigung, diesen Eintrag zu löschen." };
  }

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("roadmap_items")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  revalidatePath("/roadmap");
  return {};
}
