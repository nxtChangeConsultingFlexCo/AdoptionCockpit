import { createClient } from "@/lib/supabase/server";
import type { CockpitKpiId } from "@/types/cockpit";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const IN_PROGRESS_STATUSES = ["cab_review", "qualified", "it_backlog", "in_implementation"];
const ROADMAP_STATUSES = ["qualified", "it_backlog", "in_implementation", "done"];

// Alle Zahlen entstehen aus einfachen COUNT-Abfragen auf assessments/
// change_requests - die Rollen-/Hierarchie-Sicht kommt bereits aus der
// bestehenden RLS (eigene Ergebnisse für employee, eigener
// org_assignments-Teilbaum für leader/ca_board/it_board/
// steering_committee, org-weit für client_admin/god), hier wird
// nichts davon dupliziert.
//
// Ausnahme: "Ausstehende Checks" hat keine Tabellenzeile, solange ein
// Check nicht begonnen wurde, RLS kann hier also nichts filtern. Diese
// eine Kennzahl bleibt deshalb bewusst immer die eigene (persönliche)
// Zahl der aufrufenden Person, unabhängig von der Rolle - siehe
// Erklärung im Chat.
export async function computeCockpitKpis(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<Record<CockpitKpiId, number>> {
  const [
    availableTemplates,
    ownCompletedTemplates,
    checksCompleted,
    requestsUnhandled,
    requestsInProgress,
    requestsDone,
    requestsOnRoadmap,
  ] = await Promise.all([
    supabase.from("assessment_templates").select("id"),
    supabase
      .from("assessments")
      .select("template_id")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("change_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("change_requests")
      .select("id", { count: "exact", head: true })
      .in("status", IN_PROGRESS_STATUSES),
    supabase
      .from("change_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "done"),
    supabase
      .from("change_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ROADMAP_STATUSES)
      .not("phase", "is", null),
  ]);

  const completedTemplateIds = new Set(
    (ownCompletedTemplates.data ?? []).map((a) => a.template_id),
  );
  const checksPending = (availableTemplates.data ?? []).filter(
    (t) => !completedTemplateIds.has(t.id),
  ).length;

  return {
    checks_pending: checksPending,
    checks_completed: checksCompleted.count ?? 0,
    requests_unhandled: requestsUnhandled.count ?? 0,
    requests_in_progress: requestsInProgress.count ?? 0,
    requests_done: requestsDone.count ?? 0,
    requests_on_roadmap: requestsOnRoadmap.count ?? 0,
  };
}
