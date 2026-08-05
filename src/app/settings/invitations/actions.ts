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

  // Wer nicht god ist, kommt hier nur über die client_admin-Org-Rolle her
  // (requireRole oben) und darf ausschließlich in die eigene Organisation
  // einladen - die RLS-Policy erzwingt das ohnehin serverseitig, hier
  // zusätzlich für eine klare Fehlermeldung statt eines generischen
  // DB-Fehlers.
  if (user.role !== "god" && organizationId !== user.organizationId) {
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
    // Konflikt mit invitations_pending_email_org_idx: für diese E-Mail
    // gibt es in dieser Org bereits eine offene Einladung.
    if (error?.code === "23505") {
      return {
        error:
          "Für diese E-Mail existiert bereits eine ausstehende Einladung in dieser Organisation. Zieh sie zuerst zurück, um erneut einzuladen.",
      };
    }
    return { error: error?.message ?? "Etwas ist schiefgelaufen." };
  }

  revalidatePath("/settings/users");
  return { token: data.token };
}

export interface RevokeInvitationResult {
  error?: string;
}

// RLS ("God can manage invitations" / "Client admins can manage
// invitations in their organization") erlaubt UPDATE bereits seit
// 0014/0015 - hier nur die Einschränkung auf noch offene Einladungen
// (angenommene bleiben unantastbar, siehe Anforderung).
export async function revokeInvitation(
  invitationId: string,
): Promise<RevokeInvitationResult> {
  await requireRole(["god", "client_admin"], "/settings/users");

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("status", "pending")
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return {
      error: "Einladung konnte nicht zurückgezogen werden (bereits angenommen oder keine Berechtigung).",
    };
  }

  revalidatePath("/settings/users");
  revalidatePath("/admin/users");
  return {};
}
