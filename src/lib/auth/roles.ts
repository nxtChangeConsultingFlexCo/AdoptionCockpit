import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/roles";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  // 'god' | 'consultant' | 'employee' - Plattformrolle. 'employee' ist
  // hier der vestigiale Default für alle Org-Nutzer; die tatsächlichen
  // Org-/Change-Governance-Rollen stehen in orgRoles (Mehrfachauswahl).
  role: AppRole;
  orgRoles: AppRole[];
  organizationId: string | null;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id, profile_roles(role)")
    .eq("id", user.id)
    .maybeSingle();

  const orgRoles = (
    (profile?.profile_roles as { role: AppRole }[] | null) ?? []
  ).map((r) => r.role);

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role ?? "employee",
    orgRoles,
    organizationId: profile?.organization_id ?? null,
  };
}

export async function getUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

// god hat automatisch jede Rolle; alle anderen Plattformrollen (nur
// 'consultant') sowie die mehrfach zuweisbaren Org-Rollen werden gegen
// orgRoles geprüft.
export function userHasRole(user: AuthenticatedUser, role: AppRole): boolean {
  if (user.role === "god") return true;
  if (user.role === role) return true;
  return user.orgRoles.includes(role);
}

// Für Server Components: leitet nicht angemeldete Nutzer zu /login um.
export async function requireUser(next: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return user;
}

// Für Server Components: leitet Nutzer ohne passende Rolle zur Startseite
// um. Erfüllt, sobald der Nutzer mindestens eine der erlaubten Rollen hat.
export async function requireRole(
  allowedRoles: AppRole[],
  next: string,
): Promise<AuthenticatedUser> {
  const user = await requireUser(next);
  if (!allowedRoles.some((role) => userHasRole(user, role))) {
    redirect("/");
  }
  return user;
}
