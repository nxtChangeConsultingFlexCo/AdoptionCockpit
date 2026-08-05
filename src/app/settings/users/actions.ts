"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/roles";

export interface UpdateUserRoleResult {
  error?: string;
}

export async function updateUserRole(
  userId: string,
  role: AppRole,
): Promise<UpdateUserRoleResult> {
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
