import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/change-requests/status-badge";
import {
  CHANGE_REQUEST_PRIORITY_LABELS,
  type ChangeRequestRow,
} from "@/types/governance";

interface MiniProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

function formatName(profile: MiniProfile | undefined) {
  if (!profile) return null;
  return (
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email
  );
}

export default async function ChangeRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("/change-requests");
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("change_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!request) {
    notFound();
  }

  const changeRequest = request as ChangeRequestRow;
  const profileIds = [
    changeRequest.requested_by,
    changeRequest.assigned_leader,
  ].filter((value): value is string => Boolean(value));

  const { data: profiles } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", profileIds)
      : { data: [] as MiniProfile[] };

  const requester = profiles?.find((p) => p.id === changeRequest.requested_by);
  const leader = profiles?.find((p) => p.id === changeRequest.assigned_leader);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/change-requests" />}
        >
          ← Zurück zur Übersicht
        </Button>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <CardTitle className="text-xl">{changeRequest.title}</CardTitle>
            <StatusBadge status={changeRequest.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {changeRequest.description}
            </p>

            <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground uppercase">
                  Eingereicht von
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {formatName(requester) ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">
                  Cluster Lead
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {formatName(leader) ?? "Noch nicht zugewiesen"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">
                  Priorität
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {changeRequest.priority
                    ? CHANGE_REQUEST_PRIORITY_LABELS[changeRequest.priority]
                    : "Keine Angabe"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">
                  Eingereicht am
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {new Date(changeRequest.created_at).toLocaleDateString(
                    "de-DE",
                    { day: "2-digit", month: "long", year: "numeric" },
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">
                  Zuletzt aktualisiert
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {new Date(changeRequest.updated_at).toLocaleDateString(
                    "de-DE",
                    { day: "2-digit", month: "long", year: "numeric" },
                  )}
                </dd>
              </div>
            </dl>

            {changeRequest.cab_decision_note && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Entscheidung des Change Advisory Board
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {changeRequest.cab_decision_note}
                </p>
              </div>
            )}

            {changeRequest.it_feedback && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Rückmeldung des IT Boards
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {changeRequest.it_feedback}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
