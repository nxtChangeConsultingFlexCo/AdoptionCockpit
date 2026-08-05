"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/roles";

export async function createChangeRequest(formData: FormData) {
  const user = await requireUser("/change-requests/new");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "");
  const priority = priorityRaw || null;

  const redirectWithError = (message: string): never => {
    redirect(`/change-requests/new?error=${encodeURIComponent(message)}`);
  };

  if (!user.organizationId) {
    redirectWithError("Deinem Account ist keine Organisation zugeordnet.");
  }
  if (!title || !description) {
    redirectWithError("Bitte Titel und Beschreibung ausfüllen.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("change_requests")
    .insert({
      organization_id: user.organizationId,
      title,
      description,
      requested_by: user.id,
      status: "submitted",
      priority,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/change-requests/new?error=${encodeURIComponent(error?.message ?? "Etwas ist schiefgelaufen.")}`,
    );
  }

  redirect(`/change-requests/${data.id}`);
}
