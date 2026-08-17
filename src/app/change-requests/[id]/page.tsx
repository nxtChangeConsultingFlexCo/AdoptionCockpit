import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/change-requests/status-badge";
import { BoardActions } from "@/components/change-requests/board-actions";
import { RoadmapFieldsForm } from "@/components/change-requests/roadmap-fields-form";
import { EditRequestForm } from "@/components/change-requests/edit-request-form";
import {
  ChangeHistory,
  type ChangeHistoryEvent,
} from "@/components/change-requests/change-history";
import {
  CommentThread,
  type CommentItem,
} from "@/components/change-requests/comment-thread";
import {
  CHANGE_REQUEST_PRIORITY_LABELS,
  type ChangeRequestRow,
  type ChangeRequestStatus,
} from "@/types/governance";

const EARLY_STAGE_STATUSES: ChangeRequestStatus[] = ["draft", "submitted"];
const EDITABLE_STATUSES: ChangeRequestStatus[] = [
  "draft",
  "submitted",
  "cab_review",
  "qualified",
  "it_backlog",
  "in_implementation",
];

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
  const user = await requireUser("/change-requests");
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

  const isEarlyStage = EARLY_STAGE_STATUSES.includes(changeRequest.status);
  const canEdit =
    EDITABLE_STATUSES.includes(changeRequest.status) &&
    (isEarlyStage
      ? user.role === "god" ||
        changeRequest.requested_by === user.id ||
        changeRequest.assigned_leader === user.id ||
        user.orgRoles.includes("leader")
      : user.role === "god" ||
        user.orgRoles.includes("ca_board") ||
        user.orgRoles.includes("client_admin"));

  const { data: eventRows } = await supabase
    .from("change_request_events")
    .select("id, changed_at, field, old_value, new_value, changed_by")
    .eq("change_request_id", changeRequest.id)
    .order("changed_at", { ascending: false });

  const changedByIds = Array.from(
    new Set((eventRows ?? []).map((e) => e.changed_by).filter((v): v is string => Boolean(v))),
  );
  const { data: eventProfiles } =
    changedByIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", changedByIds)
      : { data: [] as MiniProfile[] };

  const eventProfileMap = new Map((eventProfiles ?? []).map((p) => [p.id, p]));
  const historyEvents: ChangeHistoryEvent[] = (eventRows ?? []).map((e) => ({
    id: e.id,
    changed_at: e.changed_at,
    field: e.field,
    old_value: e.old_value,
    new_value: e.new_value,
    changed_by_name:
      formatName(eventProfileMap.get(e.changed_by ?? "")) ?? "Unbekannt",
  }));

  const { data: commentRows } = await supabase
    .from("change_request_comments")
    .select("id, body, created_at, author_id")
    .eq("change_request_id", changeRequest.id)
    .order("created_at", { ascending: true });

  const commentAuthorIds = Array.from(
    new Set((commentRows ?? []).map((c) => c.author_id).filter((v): v is string => Boolean(v))),
  );
  const { data: commentProfiles } =
    commentAuthorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", commentAuthorIds)
      : { data: [] as MiniProfile[] };

  const commentProfileMap = new Map((commentProfiles ?? []).map((p) => [p.id, p]));
  const comments: CommentItem[] = (commentRows ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    author_name: formatName(commentProfileMap.get(c.author_id ?? "")) ?? "Unbekannt",
  }));

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

            {canEdit && (
              <EditRequestForm
                requestId={changeRequest.id}
                initialTitle={changeRequest.title}
                initialDescription={changeRequest.description}
                initialPriority={changeRequest.priority}
              />
            )}

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
              <div>
                <dt className="text-xs text-muted-foreground uppercase">
                  Roadmap-Phase
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {changeRequest.phase ?? "Noch nicht eingeplant"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground uppercase">
                  Zieldatum
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {changeRequest.target_date
                    ? new Date(changeRequest.target_date).toLocaleDateString(
                        "de-DE",
                        { day: "2-digit", month: "long", year: "numeric" },
                      )
                    : "—"}
                </dd>
              </div>
            </dl>

            {changeRequest.cab_decision_note && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Entscheidung des CA Board
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

            <BoardActions
              requestId={changeRequest.id}
              status={changeRequest.status}
              orgRoles={user.orgRoles}
              isGod={user.role === "god"}
            />

            {(user.role === "god" ||
              user.orgRoles.includes("ca_board") ||
              user.orgRoles.includes("client_admin")) && (
              <RoadmapFieldsForm
                requestId={changeRequest.id}
                initialPhase={changeRequest.phase}
                initialTargetDate={changeRequest.target_date}
              />
            )}

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">
                Änderungsverlauf
              </p>
              <ChangeHistory events={historyEvents} />
            </div>

            <CommentThread requestId={changeRequest.id} comments={comments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
