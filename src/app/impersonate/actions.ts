"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, IMPERSONATION_COOKIE } from "@/lib/auth/roles";

export interface ImpersonationActionResult {
  error?: string;
}

export async function startImpersonation(
  targetUserId: string,
): Promise<ImpersonationActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Nicht angemeldet." };
  if (currentUser.impersonatorId) {
    return { error: "Bereits im Mimik-Modus. Erst beenden, dann neu starten." };
  }
  if (currentUser.id === targetUserId) {
    return { error: "Du kannst dich nicht selbst ansehen." };
  }

  const isGod = currentUser.role === "god";
  const isClientAdmin = currentUser.orgRoles.includes("client_admin");
  if (!isGod && !isClientAdmin) {
    return { error: "Keine Berechtigung für Mimik." };
  }

  const supabase = await createClient();

  if (!isGod) {
    const { data: target } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!target || target.organization_id !== currentUser.organizationId) {
      return { error: "Mimik nur für Mitglieder der eigenen Organisation möglich." };
    }
  }

  const { data, error } = await supabase
    .from("impersonation_audit")
    .insert({ impersonator_id: currentUser.id, target_user_id: targetUserId })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Mimik konnte nicht gestartet werden." };
  }

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect("/");
}

export async function endImpersonation(): Promise<void> {
  const cookieStore = await cookies();
  const auditId = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (auditId) {
    const supabase = await createClient();
    await supabase
      .from("impersonation_audit")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", auditId);
  }

  cookieStore.delete(IMPERSONATION_COOKIE);
  redirect("/");
}
