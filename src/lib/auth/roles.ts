import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/roles";

export const IMPERSONATION_COOKIE = "impersonation_id";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  displayName: string;
  // 'god' | 'consultant' | 'employee' - Plattformrolle. 'employee' ist
  // hier der vestigiale Default für alle Org-Nutzer; die tatsächlichen
  // Org-/Change-Governance-Rollen stehen in orgRoles (Mehrfachauswahl).
  role: AppRole;
  orgRoles: AppRole[];
  organizationId: string | null;
  // Gesetzt, wenn diese Identität gerade per Mimik überlagert ist - dann
  // enthält id/role/orgRoles/organizationId bereits die Zielperson,
  // impersonatorId ist die echte (Supabase-Session-)Identität dahinter.
  impersonatorId: string | null;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Liest die aktive Mimik-Zeile für den echten (Session-)Nutzer, falls
// vorhanden - RLS lässt hier nur Zeilen zu, deren impersonator_id dem
// aufrufenden auth.uid() entspricht, ein manipulierter Cookie-Wert auf
// eine fremde Zeile liefert also einfach nichts zurück.
async function resolveActiveImpersonation(
  supabase: SupabaseServerClient,
  realUserId: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const auditId = cookieStore.get(IMPERSONATION_COOKIE)?.value;
  if (!auditId) return null;

  const { data } = await supabase
    .from("impersonation_audit")
    .select("impersonator_id, target_user_id, ended_at")
    .eq("id", auditId)
    .maybeSingle();

  if (!data || data.impersonator_id !== realUserId || data.ended_at) {
    return null;
  }

  return data.target_user_id;
}

// Gesperrte Accounts/Organisationen dürfen keine aktive Session behalten
// - unabhängig von Mimik wird hier immer die ECHTE (Session-)Identität
// geprüft, nicht die per Mimik überlagerte. Bei Treffer wird sofort
// abgemeldet, damit auch schon bestehende Sessions (Sperrung passiert
// während jemand eingeloggt ist) nicht weiterlaufen.
async function enforceNotBlocked(
  supabase: SupabaseServerClient,
  realUserId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_blocked, organization_id")
    .eq("id", realUserId)
    .maybeSingle();

  let blocked = profile?.is_blocked ?? false;

  if (!blocked && profile?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("is_blocked")
      .eq("id", profile.organization_id)
      .maybeSingle();
    blocked = org?.is_blocked ?? false;
  }

  if (blocked) {
    await supabase.auth.signOut();
  }

  return blocked;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  if (await enforceNotBlocked(supabase, user.id)) {
    return null;
  }

  const targetUserId = await resolveActiveImpersonation(supabase, user.id);
  const effectiveUserId = targetUserId ?? user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id, email, first_name, last_name, profile_roles(role)")
    .eq("id", effectiveUserId)
    .maybeSingle();

  const orgRoles = (
    (profile?.profile_roles as { role: AppRole }[] | null) ?? []
  ).map((r) => r.role);

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    (effectiveUserId === user.id ? user.email : null) ||
    "Unbekannt";

  return {
    id: effectiveUserId,
    email: profile?.email ?? (effectiveUserId === user.id ? (user.email ?? null) : null),
    displayName,
    role: profile?.role ?? "employee",
    orgRoles,
    organizationId: profile?.organization_id ?? null,
    impersonatorId: targetUserId ? user.id : null,
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
// Während einer Mimik gilt hier bewusst die Rolle der Zielperson, nicht
// die des echten Admins dahinter - das ist der Sinn der Mimik ("UI-Rechte
// des gespiegelten Users").
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
