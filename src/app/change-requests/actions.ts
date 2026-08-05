"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/roles";

export interface ChangeRequestActionResult {
  error?: string;
}

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

// Cluster Lead: übernimmt eine eingereichte Anfrage und leitet sie an
// das CA Board weiter. RLS erlaubt jedem "leader" der Organisation
// diese Aktion (kein Vor-Zuweisen nötig, siehe 0010).
export async function forwardToCab(
  requestId: string,
): Promise<ChangeRequestActionResult> {
  const user = await requireUser(`/change-requests/${requestId}`);
  const supabase = await createClient();

  const { error, data } = await supabase
    .from("change_requests")
    .update({ status: "cab_review", assigned_leader: user.id })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  revalidatePath(`/change-requests/${requestId}`);
  return {};
}

// CA Board: qualifiziert (-> geht in den IT-Backlog) oder lehnt eine
// Anfrage ab, jeweils mit optionaler Begründung.
export async function decideCabReview(
  requestId: string,
  decision: "qualified" | "rejected",
  note: string,
): Promise<ChangeRequestActionResult> {
  await requireUser(`/change-requests/${requestId}`);
  const supabase = await createClient();

  const nextStatus = decision === "qualified" ? "it_backlog" : "rejected";

  const { error, data } = await supabase
    .from("change_requests")
    .update({ status: nextStatus, cab_decision_note: note || null })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  revalidatePath(`/change-requests/${requestId}`);
  return {};
}

// IT Board: nimmt eine Anfrage aus dem Backlog in Umsetzung oder
// schließt sie ab, jeweils mit optionalem Feedback an den Cluster Lead.
export async function updateItBoardStatus(
  requestId: string,
  nextStatus: "in_implementation" | "done",
  feedback: string,
): Promise<ChangeRequestActionResult> {
  await requireUser(`/change-requests/${requestId}`);
  const supabase = await createClient();

  const { error, data } = await supabase
    .from("change_requests")
    .update({ status: nextStatus, it_feedback: feedback || null })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  revalidatePath(`/change-requests/${requestId}`);
  return {};
}
