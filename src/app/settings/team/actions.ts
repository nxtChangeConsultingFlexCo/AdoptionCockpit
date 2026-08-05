"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface TeamActionResult {
  error?: string;
}

// RLS ("Users can manage their own assignment") lässt ohnehin nur
// Schreibzugriffe auf die eigene Zeile (child_user_id = auth.uid())
// zu - organizationId wird hier nur zum Befüllen der Zeile gebraucht.
export async function setMyManager(
  parentUserId: string | null,
): Promise<TeamActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet." };

  if (parentUserId === null) {
    const { error } = await supabase
      .from("org_assignments")
      .delete()
      .eq("child_user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/settings/team");
    return {};
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.organization_id) {
    return { error: "Keiner Organisation zugeordnet." };
  }

  const { error } = await supabase.from("org_assignments").upsert(
    {
      child_user_id: user.id,
      parent_user_id: parentUserId,
      organization_id: profile.organization_id,
    },
    { onConflict: "child_user_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return {};
}
