"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (email) {
    const supabase = await createClient();

    // Herkunft aus dem tatsächlichen Request ableiten statt der im
    // Supabase-Dashboard hinterlegten Site URL zu vertrauen - siehe
    // gleiches Vorgehen in src/app/register/actions.ts.
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // Fehler bewusst ignorieren (z. B. "Nutzer nicht gefunden") - die
    // Rückmeldung bleibt in jedem Fall identisch, um kein
    // User-Enumeration-Leak über existierende E-Mail-Adressen zu öffnen.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/settings/profile`,
    });
  }

  redirect("/login/forgot-password?sent=1");
}
