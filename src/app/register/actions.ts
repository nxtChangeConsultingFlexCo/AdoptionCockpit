"use server";

import { redirect } from "next/navigation";
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
  const next = String(formData.get("next") ?? "/assessment");

  const redirectWithError = (message: string) => {
    redirect(
      `/register?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`,
    );
  };

  if (!firstName || !lastName || !companyName) {
    redirectWithError("Bitte fülle alle Pflichtfelder aus.");
  }
  if (!gdprConsent) {
    redirectWithError("Bitte stimme der Datenverarbeitung zu.");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        job_title: jobTitle,
        gdpr_consent: gdprConsent,
        marketing_consent: marketingConsent,
      },
    },
  });

  if (error) {
    redirectWithError(error.message);
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
