"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SetOrgBlockedResult {
  error?: string;
}

// RLS ("God can update any organization") ist die eigentliche Grenze -
// nur god hat überhaupt eine UPDATE-Policy auf organizations.
export async function setOrgBlocked(
  orgId: string,
  isBlocked: boolean,
): Promise<SetOrgBlockedResult> {
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("organizations")
    .update({ is_blocked: isBlocked })
    .eq("id", orgId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung, diese Organisation zu sperren." };
  }

  revalidatePath("/admin/organizations");
  return {};
}
