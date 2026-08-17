"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("first_name") ?? "");
  const lastName = String(formData.get("last_name") ?? "");
  const companyName = String(formData.get("company_name") ?? "");
  const jobTitle = String(formData.get("job_title") ?? "");
  const gdprConsent = formData.get("gdpr_consent") === "on";
  const marketingConsent = formData.get("marketing_consent") === "on";
  const inviteToken = String(formData.get("invite_token") ?? "");
  const next = String(formData.get("next") ?? "/assessment");

  const redirectWithError = (message: string) => {
    const inviteParam = inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : "";
    redirect(
      `/register?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}${inviteParam}`,
    );
  };

  // Bei einer Einladung ist die Organisation bereits festgelegt - kein
  // eigener Firmenname nötig.
  if (!firstName || !lastName || (!inviteToken && !companyName)) {
    redirectWithError("Bitte fülle alle Pflichtfelder aus.");
  }
  if (!gdprConsent) {
    redirectWithError("Bitte stimme der Datenverarbeitung zu.");
  }

  const supabase = await createClient();

  // Ohne explizite emailRedirectTo verwendet Supabase die im Dashboard
  // hinterlegte Site URL - die zeigt nicht zuverlässig auf unseren
  // Callback-Handler (der den Bestätigungs-Code erst gegen eine echte
  // Session eintauscht). Herkunft daher aus dem tatsächlichen Request
  // ableiten, funktioniert so in jeder Umgebung (lokal, Vercel, ...).
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        job_title: jobTitle,
        gdpr_consent: gdprConsent,
        marketing_consent: marketingConsent,
        invite_token: inviteToken || undefined,
      },
    },
  });

  if (error) {
    redirectWithError(error.message);
  }

  // Supabase gibt bei einer bereits registrierten E-Mail bewusst keinen
  // Error zurück (Schutz gegen User-Enumeration), sondern ein "User"-Objekt
  // ohne Identities und ohne Session - ansonsten nicht von einer echten
  // Neu-Registrierung zu unterscheiden. Ohne diese Prüfung landet man auf
  // der "Bitte E-Mail bestätigen"-Seite, obwohl gar keine neue Mail
  // verschickt wurde, und wartet vergeblich.
  if (signUpData.user && signUpData.user.identities?.length === 0) {
    redirectWithError(
      "Für diese E-Mail-Adresse existiert bereits ein Konto. Bitte melde dich stattdessen an.",
    );
  }

  // Ist "Confirm email" im Supabase-Projekt aktiviert, existiert direkt nach
  // signUp() noch keine Session - Nutzer muss die E-Mail erst bestätigen.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/register/confirm?next=${encodeURIComponent(next)}`);
  }

  redirect(next);
}
