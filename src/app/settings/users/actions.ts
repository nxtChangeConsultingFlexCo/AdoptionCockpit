"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/roles";

export interface ToggleUserRoleResult {
  error?: string;
}

// Org-/Change-Governance-Rollen sind mehrfach kombinierbar: statt eine
// einzelne Rolle zu setzen, wird hier je eine Zeile in profile_roles
// hinzugefügt oder entfernt. RLS auf profile_roles regelt, wer wessen
// Rollen ändern darf (god überall, client_admin nur in der eigenen Org).
export async function toggleUserRole(
  userId: string,
  role: AppRole,
  enabled: boolean,
): Promise<ToggleUserRoleResult> {
  const supabase = await createClient();

  if (enabled) {
    const { error } = await supabase
      .from("profile_roles")
      .upsert(
        { profile_id: userId, role },
        { onConflict: "profile_id,role", ignoreDuplicates: true },
      );

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error, data } = await supabase
      .from("profile_roles")
      .delete()
      .eq("profile_id", userId)
      .eq("role", role)
      .select("role");

    if (error) {
      return { error: error.message };
    }
    if (!data || data.length === 0) {
      return { error: "Keine Berechtigung, diese Rolle zu ändern." };
    }
  }

  revalidatePath("/settings/users");
  return {};
}

export interface UpdatePlatformRoleResult {
  error?: string;
}

// Plattformrollen (employee/consultant/god) bleiben exklusiv und liegen
// weiterhin in profiles.role, getrennt von den mehrfach kombinierbaren
// Org-Rollen in profile_roles. Der guard_profile_role_change-Trigger
// lässt Änderungen an profiles.role ausschließlich durch god zu.
export async function updatePlatformRole(
  userId: string,
  role: "employee" | "consultant" | "god",
): Promise<UpdatePlatformRoleResult> {
  const supabase = await createClient();

  const { error, data } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung, diese Rolle zu ändern." };
  }

  revalidatePath("/settings/users");
  return {};
}
