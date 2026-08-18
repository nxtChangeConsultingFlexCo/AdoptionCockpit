"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/roles";
import { getSelectedProject } from "@/lib/project-context";
import type { ChangeRequestStatus } from "@/types/governance";

export interface ChangeRequestActionResult {
  error?: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Ein Eintrag im Änderungsverlauf je geändertem Feld - still
// überschreiben ist bewusst nicht vorgesehen (siehe Migration 0034).
// Wird nach einem erfolgreichen Update aufgerufen, nie davor.
async function logFieldEvent(
  supabase: SupabaseServerClient,
  changeRequestId: string,
  changedBy: string,
  field: string,
  oldValue: string | null,
  newValue: string | null,
) {
  if (oldValue === newValue) return;
  await supabase.from("change_request_events").insert({
    change_request_id: changeRequestId,
    changed_by: changedBy,
    field,
    old_value: oldValue,
    new_value: newValue,
  });
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
  const { projectId } = await getSelectedProject(supabase);
  if (!projectId) {
    redirectWithError("Kein Projekt vorhanden. Bitte zuerst ein Projekt anlegen.");
  }

  const { data, error } = await supabase
    .from("change_requests")
    .insert({
      organization_id: user.organizationId,
      project_id: projectId,
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

// Bearbeiten nach dem Anlegen: Titel/Beschreibung/Priorität. Rechte
// (siehe Chat-Vorgabe) sind bewusst hier in der Anwendung geprüft,
// nicht als eigene RLS-Policy - die bestehende, gröbere
// "Requesters can edit their own draft requests"-Policy bleibt das
// technische Sicherheitsnetz darunter.
const EARLY_STAGE_STATUSES: ChangeRequestStatus[] = ["draft", "submitted"];
const EDITABLE_STATUSES: ChangeRequestStatus[] = [
  "draft",
  "submitted",
  "cab_review",
  "qualified",
  "it_backlog",
  "in_implementation",
];

export async function updateChangeRequestFields(
  requestId: string,
  title: string,
  description: string,
  priority: string,
): Promise<ChangeRequestActionResult> {
  const user = await requireUser(`/change-requests/${requestId}`);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("change_requests")
    .select("title, description, priority, status, requested_by, assigned_leader")
    .eq("id", requestId)
    .maybeSingle();

  if (!current) {
    return { error: "Anfrage nicht gefunden." };
  }
  if (!EDITABLE_STATUSES.includes(current.status)) {
    return {
      error: "Diese Anfrage ist abgeschlossen und kann nicht mehr bearbeitet werden.",
    };
  }

  const isEarlyStage = EARLY_STAGE_STATUSES.includes(current.status);
  const canEdit = isEarlyStage
    ? user.role === "god" ||
      current.requested_by === user.id ||
      current.assigned_leader === user.id ||
      user.orgRoles.includes("leader")
    : user.role === "god" ||
      user.orgRoles.includes("ca_board") ||
      user.orgRoles.includes("client_admin");

  if (!canEdit) {
    return { error: "Keine Berechtigung, diese Anfrage zu bearbeiten." };
  }

  if (!title.trim() || !description.trim()) {
    return { error: "Titel und Beschreibung dürfen nicht leer sein." };
  }

  const nextPriority = priority || null;
  const { error, data } = await supabase
    .from("change_requests")
    .update({
      title: title.trim(),
      description: description.trim(),
      priority: nextPriority,
    })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  await Promise.all([
    logFieldEvent(supabase, requestId, user.id, "title", current.title, title.trim()),
    logFieldEvent(
      supabase,
      requestId,
      user.id,
      "description",
      current.description,
      description.trim(),
    ),
    logFieldEvent(
      supabase,
      requestId,
      user.id,
      "priority",
      current.priority,
      nextPriority,
    ),
  ]);

  revalidatePath(`/change-requests/${requestId}`);
  return {};
}

// Cluster Lead: übernimmt eine eingereichte Anfrage und leitet sie an
// das CA Board weiter. RLS erlaubt jedem "leader" der Organisation
// diese Aktion (kein Vor-Zuweisen nötig, siehe 0010).
export async function forwardToCab(
  requestId: string,
): Promise<ChangeRequestActionResult> {
  const user = await requireUser(`/change-requests/${requestId}`);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("change_requests")
    .select("status")
    .eq("id", requestId)
    .maybeSingle();

  const { error, data } = await supabase
    .from("change_requests")
    .update({ status: "cab_review", assigned_leader: user.id })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  await logFieldEvent(
    supabase,
    requestId,
    user.id,
    "status",
    current?.status ?? null,
    "cab_review",
  );

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
  const user = await requireUser(`/change-requests/${requestId}`);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("change_requests")
    .select("status, cab_decision_note")
    .eq("id", requestId)
    .maybeSingle();

  const nextStatus = decision === "qualified" ? "it_backlog" : "rejected";
  const nextNote = note || null;

  const { error, data } = await supabase
    .from("change_requests")
    .update({ status: nextStatus, cab_decision_note: nextNote })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  await Promise.all([
    logFieldEvent(supabase, requestId, user.id, "status", current?.status ?? null, nextStatus),
    logFieldEvent(
      supabase,
      requestId,
      user.id,
      "cab_decision_note",
      current?.cab_decision_note ?? null,
      nextNote,
    ),
  ]);

  revalidatePath(`/change-requests/${requestId}`);
  return {};
}

// CA Board/client_admin: planen eine qualifizierte Anfrage für die
// Roadmap ein (Phase + optionales Zieldatum). RLS erlaubt das
// Schreiben technisch auch anderen Board-Rollen mit Update-Zugriff auf
// die Anfrage - die Einschränkung auf CA Board/client_admin/god
// erfolgt bewusst hier in der Anwendung, siehe Migration 0026.
export async function setRoadmapFields(
  requestId: string,
  phase: string,
  targetDate: string,
): Promise<ChangeRequestActionResult> {
  const user = await requireUser(`/change-requests/${requestId}`);
  const canSetRoadmap =
    user.role === "god" ||
    user.orgRoles.includes("ca_board") ||
    user.orgRoles.includes("client_admin");

  if (!canSetRoadmap) {
    return { error: "Keine Berechtigung, die Roadmap-Planung zu ändern." };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("change_requests")
    .select("phase, target_date")
    .eq("id", requestId)
    .maybeSingle();

  const nextPhase = phase.trim() || null;
  const nextTargetDate = targetDate || null;

  const { error, data } = await supabase
    .from("change_requests")
    .update({ phase: nextPhase, target_date: nextTargetDate })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  await Promise.all([
    logFieldEvent(supabase, requestId, user.id, "phase", current?.phase ?? null, nextPhase),
    logFieldEvent(
      supabase,
      requestId,
      user.id,
      "target_date",
      current?.target_date ?? null,
      nextTargetDate,
    ),
  ]);

  revalidatePath(`/change-requests/${requestId}`);
  revalidatePath("/roadmap");
  return {};
}

// IT Board: nimmt eine Anfrage aus dem Backlog in Umsetzung oder
// schließt sie ab, jeweils mit optionalem Feedback an den Cluster Lead.
export async function updateItBoardStatus(
  requestId: string,
  nextStatus: "in_implementation" | "done",
  feedback: string,
): Promise<ChangeRequestActionResult> {
  const user = await requireUser(`/change-requests/${requestId}`);
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("change_requests")
    .select("status, it_feedback")
    .eq("id", requestId)
    .maybeSingle();

  const nextFeedback = feedback || null;

  const { error, data } = await supabase
    .from("change_requests")
    .update({ status: nextStatus, it_feedback: nextFeedback })
    .eq("id", requestId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung für diese Aktion." };
  }

  await Promise.all([
    logFieldEvent(supabase, requestId, user.id, "status", current?.status ?? null, nextStatus),
    logFieldEvent(
      supabase,
      requestId,
      user.id,
      "it_feedback",
      current?.it_feedback ?? null,
      nextFeedback,
    ),
  ]);

  revalidatePath(`/change-requests/${requestId}`);
  return {};
}
