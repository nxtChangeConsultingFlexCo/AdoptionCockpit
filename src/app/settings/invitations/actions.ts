"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/roles";
import type { AppRole } from "@/types/roles";

export interface CreateInvitationResult {
  error?: string;
  token?: string;
}

export async function createInvitation(
  email: string,
  role: AppRole,
  organizationId: string,
): Promise<CreateInvitationResult> {
  const user = await requireRole(["god"], "/settings/invitations");

  if (!email.trim() || !organizationId) {
    return { error: "Bitte E-Mail und Organisation angeben." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email: email.trim().toLowerCase(),
      role,
      organization_id: organizationId,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Etwas ist schiefgelaufen." };
  }

  revalidatePath("/settings/invitations");
  return { token: data.token };
}
