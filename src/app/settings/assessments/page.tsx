import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AssessmentAvailabilityToggle } from "@/components/settings/assessment-availability-toggle";
import { AssessmentScopeEditor } from "@/components/settings/assessment-scope-editor";
import {
  AssessmentResultsTable,
  type AssessmentResultRow,
} from "@/components/settings/assessment-results-table";
import type { AssessmentScopeType } from "@/types/template";

interface CatalogEntry {
  id: string;
  is_available: boolean;
  sort_order: number;
  scope_type: AssessmentScopeType;
  role_list: string[];
  user_ids: string[];
  assessment_templates: {
    id: string;
    title: string;
    slug: string;
    is_active: boolean;
  } | null;
}

interface CompletedAssessment {
  id: string;
  created_at: string;
  total_score: number | null;
  user_id: string | null;
  assessment_templates: { title: string } | null;
}

interface ProfileSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export default async function OrgAssessmentsPage() {
  const currentUser = await requireRole(
    ["client_admin", "steering_committee"],
    "/settings/assessments",
  );
  // Steering Committee ist Aufsicht/Reporting, kein Genehmiger - sieht
  // die Ergebnisse org-weit, verwaltet aber nicht den Freigabe-Katalog.
  const canManageCatalog =
    currentUser.role === "god" || currentUser.orgRoles.includes("client_admin");
  const organizationId = currentUser.organizationId;
  const supabase = await createClient();

  const { data: catalogData } =
    canManageCatalog && organizationId
      ? await supabase
          .from("organization_assessments")
          .select(
            "id, is_available, sort_order, scope_type, role_list, user_ids, assessment_templates(id, title, slug, is_active)",
          )
          .eq("organization_id", organizationId)
          .order("sort_order", { ascending: true })
      : { data: null };

  const catalog = ((catalogData ?? []) as unknown as CatalogEntry[]).filter(
    (
      entry,
    ): entry is CatalogEntry & {
      assessment_templates: NonNullable<CatalogEntry["assessment_templates"]>;
    } => Boolean(entry.assessment_templates),
  );

  const { data: memberData } =
    canManageCatalog && organizationId
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("organization_id", organizationId)
          .order("first_name", { ascending: true })
      : { data: [] as ProfileSummary[] };

  const orgMembers = ((memberData ?? []) as ProfileSummary[]).map((p) => ({
    id: p.id,
    name:
      [p.first_name, p.last_name].filter(Boolean).join(" ") ||
      p.email ||
      "Unbekannt",
  }));

  // RLS ("Client admins can view assessments in their organization" /
  // "Steering committee can view assessments in their organization")
  // beschränkt das Ergebnis bereits auf die eigene Org - kein
  // zusätzlicher Filter hier nötig (assessments hat keine
  // organization_id-Spalte, nur user_id -> profiles.organization_id).
  const { data: assessmentData } = await supabase
    .from("assessments")
    .select("id, created_at, total_score, user_id, assessment_templates(title)")
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const assessments = (assessmentData ?? []) as unknown as CompletedAssessment[];

  const userIds = Array.from(
    new Set(
      assessments.map((a) => a.user_id).filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: profileData } =
    userIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds)
      : { data: [] as ProfileSummary[] };

  const profileMap = new Map(
    ((profileData ?? []) as ProfileSummary[]).map((p) => [p.id, p]),
  );

  const resultRows: AssessmentResultRow[] = assessments.map((assessment) => {
    const profile = assessment.user_id ? profileMap.get(assessment.user_id) : undefined;
    const name = profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        profile.email ||
        "Unbekannt"
      : "Unbekannt";
    return {
      id: assessment.id,
      name,
      checkTitle: assessment.assessment_templates?.title ?? "Check",
      createdAt: assessment.created_at,
      score: assessment.total_score,
    };
  });

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Einstellungen
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Checks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManageCatalog
              ? "Verwalte, welche Checks in deiner Organisation verfügbar sind, und sieh alle abgeschlossenen Ergebnisse ein."
              : "Aufsicht/Reporting: alle abgeschlossenen Ergebnisse deiner Organisation."}
          </p>
        </div>

        {canManageCatalog && (
          <section id="katalog" className="flex flex-col gap-4 scroll-mt-20">
            <h2 className="text-lg font-medium text-foreground">
              Verfügbare Checks
            </h2>
            {catalog.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                Noch keine Checks im Katalog.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {catalog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">
                        {entry.assessment_templates.title}
                      </span>
                      {!entry.assessment_templates.is_active && (
                        <span className="text-xs text-muted-foreground">
                          Vom Anbieter deaktiviert
                        </span>
                      )}
                      <AssessmentScopeEditor
                        organizationId={organizationId ?? ""}
                        templateId={entry.assessment_templates.id}
                        initialScopeType={entry.scope_type}
                        initialRoleList={entry.role_list}
                        initialUserIds={entry.user_ids}
                        members={orgMembers}
                      />
                    </div>
                    <AssessmentAvailabilityToggle
                      organizationId={organizationId ?? ""}
                      templateId={entry.assessment_templates.id}
                      isAvailable={entry.is_available}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section
          id="ergebnisse"
          className={
            canManageCatalog
              ? "flex flex-col gap-4 border-t border-border pt-8 scroll-mt-20"
              : "flex flex-col gap-4 scroll-mt-20"
          }
        >
          <h2 className="text-lg font-medium text-foreground">
            Ergebnisse ({assessments.length})
          </h2>
          {assessments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              Noch keine abgeschlossenen Checks in deiner Organisation.
            </div>
          ) : (
            <AssessmentResultsTable rows={resultRows} />
          )}
        </section>
      </div>
    </div>
  );
}
