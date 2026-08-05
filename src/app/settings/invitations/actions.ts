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
  const user = await requireRole(["god", "client_admin"], "/settings/users");

  if (!email.trim() || !organizationId) {
    return { error: "Bitte E-Mail und Organisation angeben." };
  }

  // client_admin darf nur in die eigene Organisation einladen - die
  // RLS-Policy erzwingt das ohnehin serverseitig, hier zusätzlich für
  // eine klare Fehlermeldung statt eines generischen DB-Fehlers.
  if (user.role === "client_admin" && organizationId !== user.organizationId) {
    return { error: "Du kannst nur in deine eigene Organisation einladen." };
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

  revalidatePath("/settings/users");
  return { token: data.token };
}
