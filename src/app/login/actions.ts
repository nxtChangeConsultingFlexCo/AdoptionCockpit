"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/assessment");

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_blocked, blocked_reason, organization_id")
    .eq("id", signInData.user.id)
    .maybeSingle();

  let blockedReason: string | null = null;
  if (profile?.is_blocked) {
    blockedReason = profile.blocked_reason || "Dieser Account wurde gesperrt.";
  } else if (profile?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("is_blocked")
      .eq("id", profile.organization_id)
      .maybeSingle();
    if (org?.is_blocked) {
      blockedReason = "Deine Organisation wurde gesperrt.";
    }
  }

  if (blockedReason) {
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent(blockedReason)}&next=${encodeURIComponent(next)}`,
    );
  }

  redirect(next);
}
