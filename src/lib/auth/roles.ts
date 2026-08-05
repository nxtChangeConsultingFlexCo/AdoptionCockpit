import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/roles";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: AppRole;
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
    .select("role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role ?? "employee",
    organizationId: profile?.organization_id ?? null,
  };
}

export async function getUserRole(): Promise<AppRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
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
// um. Noch ungenutzt - Grundlage für den künftigen "god"-Admin-Bereich.
export async function requireRole(
  allowedRoles: AppRole[],
  next: string,
): Promise<AuthenticatedUser> {
  const user = await requireUser(next);
  if (!allowedRoles.includes(user.role)) {
    redirect("/");
  }
  return user;
}
