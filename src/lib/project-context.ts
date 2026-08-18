import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const SELECTED_PROJECT_COOKIE = "selected_project_id";

export interface ProjectOption {
  id: string;
  name: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Liefert die Projekte der eigenen Organisation (RLS filtert bereits
// auf current_user_org()) plus das aktuell gewählte Projekt. Ohne
// gültige Auswahl (Cookie fehlt/zeigt auf ein fremdes oder gelöschtes
// Projekt) fällt das auf das älteste Projekt zurück - das ist beim
// Retrofit aus Migration 0043 immer das automatisch angelegte
// Default-Projekt, damit Bestandsnutzer:innen ohne eigenes Zutun ein
// gültiges Projekt sehen.
export async function getSelectedProject(
  supabase: SupabaseServerClient,
): Promise<{ projectId: string | null; projects: ProjectOption[] }> {
  const { data } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: true });

  const projects = (data ?? []) as ProjectOption[];
  if (projects.length === 0) {
    return { projectId: null, projects };
  }

  const cookieStore = await cookies();
  const requested = cookieStore.get(SELECTED_PROJECT_COOKIE)?.value;
  const isValid = requested && projects.some((p) => p.id === requested);

  return { projectId: isValid ? requested! : projects[0].id, projects };
}
