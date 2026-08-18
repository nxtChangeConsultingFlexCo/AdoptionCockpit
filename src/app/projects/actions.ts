"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, type AuthenticatedUser } from "@/lib/auth/roles";
import { SELECTED_PROJECT_COOKIE } from "@/lib/project-context";

export interface ProjectActionResult {
  error?: string;
}

// RLS ("Client admins can manage projects/programs in their
// organization") ist die eigentliche Grenze - hier nur für eine frühe,
// freundliche Fehlermeldung, siehe gleiches Muster in roadmap/actions.ts.
function canManageProjects(user: AuthenticatedUser): boolean {
  return user.role === "god" || user.orgRoles.includes("client_admin");
}

export async function createProgram(formData: FormData) {
  const user = await requireUser("/projects/new");
  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const targetDate = String(formData.get("target_date") ?? "");

  const redirectWithError = (message: string): never => {
    redirect(`/programs/new?error=${encodeURIComponent(message)}`);
  };

  if (!canManageProjects(user)) {
    redirectWithError("Keine Berechtigung, Programme anzulegen.");
  }
  if (!user.organizationId) {
    redirectWithError("Deinem Account ist keine Organisation zugeordnet.");
  }
  if (!name) {
    redirectWithError("Name darf nicht leer sein.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("programs").insert({
    organization_id: user.organizationId,
    name,
    goal: goal || null,
    target_date: targetDate || null,
    created_by: user.id,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function createProject(formData: FormData) {
  const user = await requireUser("/projects/new");
  const name = String(formData.get("name") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const programIdRaw = String(formData.get("program_id") ?? "");
  const targetDate = String(formData.get("target_date") ?? "");
  const leadIdRaw = String(formData.get("lead") ?? "");

  const redirectWithError = (message: string): never => {
    redirect(`/projects/new?error=${encodeURIComponent(message)}`);
  };

  if (!canManageProjects(user)) {
    redirectWithError("Keine Berechtigung, Projekte anzulegen.");
  }
  if (!user.organizationId) {
    redirectWithError("Deinem Account ist keine Organisation zugeordnet.");
  }
  if (!name) {
    redirectWithError("Name darf nicht leer sein.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: user.organizationId,
      program_id: programIdRaw || null,
      name,
      goal: goal || null,
      target_date: targetDate || null,
      lead: leadIdRaw || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(error?.message ?? "Etwas ist schiefgelaufen.");
    return;
  }

  // Ein neu angelegtes Projekt darf für seine/n Verantwortliche/n nicht
  // unsichtbar sein (siehe current_user_can_access_project) - client_admin/
  // god sehen es ohnehin, aber ein lead ohne eigene Admin-Rolle braucht
  // die explizite Mitgliedschaft.
  if (leadIdRaw) {
    await supabase.from("project_members").insert({
      project_id: data.id,
      user_id: leadIdRaw,
      added_by: user.id,
    });
  }

  revalidatePath("/projects");
  redirect("/projects");
}

// RLS ("Members can view visible project's membership" /
// "Client admins can manage members of their organization's
// projects") ist die eigentliche Grenze - hier nur für eine frühe,
// freundliche Fehlermeldung.
export async function addProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectActionResult> {
  const user = await requireUser(`/projects/${projectId}`);
  if (!canManageProjects(user)) {
    return { error: "Keine Berechtigung, Mitglieder zu verwalten." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    added_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return {};
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<ProjectActionResult> {
  const user = await requireUser(`/projects/${projectId}`);
  if (!canManageProjects(user)) {
    return { error: "Keine Berechtigung, Mitglieder zu verwalten." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return {};
}

// Setzt das im Cockpit/Roadmap/Change-Requests aktive Projekt (siehe
// project-context.ts). Kein RLS-Check nötig - liest bei jeder
// Verwendung ohnehin nur Projekte, die die Org-Policies der Person
// zeigen; ein manipulierter Cookie-Wert auf ein fremdes Projekt fällt
// dort einfach auf das Default-Projekt zurück.
export async function selectProject(formData: FormData) {
  await requireUser("/projects");
  const projectId = String(formData.get("project_id") ?? "");
  if (!projectId) return;

  const cookieStore = await cookies();
  cookieStore.set(SELECTED_PROJECT_COOKIE, projectId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/cockpit");
  revalidatePath("/roadmap");
  revalidatePath("/change-requests");
  revalidatePath("/projects");
}
