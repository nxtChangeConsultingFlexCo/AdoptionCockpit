import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { OrgBlockToggle } from "@/components/settings/org-block-toggle";
import type { OrganizationRow } from "@/types/governance";

export default async function AdminOrganizationsPage() {
  await requireRole(["god"], "/admin/organizations");
  const supabase = await createClient();

  const { data } = await supabase
    .from("organizations")
    .select("id, created_at, name, is_blocked")
    .order("name", { ascending: true });

  const organizations = (data ?? []) as OrganizationRow[];

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Admin
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Organisationen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gesperrte Organisationen werden bei allen Mitgliedern beim
            nächsten Zugriff abgemeldet.
          </p>
        </div>

        {organizations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            Noch keine Organisationen vorhanden.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">
                    {org.name}
                  </span>
                  {org.is_blocked && (
                    <span className="inline-flex w-fit items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Gesperrt
                    </span>
                  )}
                </div>
                <OrgBlockToggle
                  orgId={org.id}
                  orgName={org.name}
                  isBlocked={org.is_blocked}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
