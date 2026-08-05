import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { InvitationForm } from "@/components/settings/invitation-form";
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";

interface InvitationListItem {
  id: string;
  email: string;
  role: AppRole;
  status: "pending" | "accepted";
  created_at: string;
  organizations: { name: string } | null;
}

export default async function InvitationsPage() {
  await requireRole(["god"], "/settings/invitations");
  const supabase = await createClient();

  const [{ data: invitations }, { data: organizations }] = await Promise.all([
    supabase
      .from("invitations")
      .select("id, email, role, status, created_at, organizations(name)")
      .order("created_at", { ascending: false }),
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  const invitationList = (invitations ?? []) as unknown as InvitationListItem[];

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Einstellungen
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Einladungen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lade neue Nutzer:innen per Link in eine Organisation ein.
          </p>
        </div>

        <InvitationForm organizations={organizations ?? []} />

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-foreground">
            Bisherige Einladungen
          </h2>
          {invitationList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Einladungen.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      <th className="px-4 py-3">E-Mail</th>
                      <th className="px-4 py-3">Rolle</th>
                      <th className="px-4 py-3">Organisation</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationList.map((invitation) => (
                      <tr
                        key={invitation.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {invitation.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {APP_ROLE_LABELS[invitation.role]}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {invitation.organizations?.name ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              invitation.status === "accepted"
                                ? "inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
                                : "inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                            }
                          >
                            {invitation.status === "accepted"
                              ? "Angenommen"
                              : "Ausstehend"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
