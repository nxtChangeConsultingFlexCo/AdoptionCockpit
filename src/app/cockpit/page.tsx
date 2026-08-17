import Link from "next/link";
import { requireUser, userHasRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/cockpit/kpi-card";
import { CockpitKpiTile } from "@/components/cockpit/cockpit-kpi-tile";
import { OnboardingChecklist, type OnboardingStep } from "@/components/cockpit/onboarding-checklist";
import type { AssessmentScores, TemplateSection } from "@/types/assessment";
import { getScoreTier, SCORE_TIER_LABELS } from "@/data/result-copy";
import type { TemplateRecommendations } from "@/types/template";
import { computeCockpitKpis } from "@/lib/cockpit-kpis";
import {
  COCKPIT_KPI_LABELS,
  COCKPIT_KPI_HREFS,
  resolveVisibleKpis,
  type CockpitKpiVisibilityConfig,
} from "@/types/cockpit";

interface CompletedAssessment {
  id: string;
  created_at: string;
  total_score: number;
  scores: AssessmentScores;
  company_name: string | null;
  template_id: string | null;
  assessment_templates: {
    sections: TemplateSection[];
    tier_low_max: number | null;
    tier_medium_max: number | null;
  } | null;
}

interface RecentAssessment {
  id: string;
  created_at: string;
  total_score: number | null;
  assessment_templates: { title: string } | null;
}

export default async function CockpitPage() {
  const user = await requireUser("/cockpit");
  const supabase = await createClient();

  const isAdmin = user.role === "god" || userHasRole(user, "client_admin");
  let visibilityConfig: CockpitKpiVisibilityConfig | null = null;
  if (user.organizationId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("cockpit_kpi_visibility")
      .eq("id", user.organizationId)
      .maybeSingle();
    visibilityConfig = (org?.cockpit_kpi_visibility ??
      null) as CockpitKpiVisibilityConfig | null;
  }
  const visibleKpiIds = resolveVisibleKpis(isAdmin, user.orgRoles, visibilityConfig);
  const kpiValues =
    visibleKpiIds.length > 0 ? await computeCockpitKpis(supabase, user.id) : null;

  // Nur dimension_average-Assessments (bisher: KI-Readiness) fließen hier
  // ein - die Dimension-KPIs unten (Stärkste/Schwächste Dimension) gehen
  // von einem 0-100-Score je Sektion aus, was bei section_sum-Templates
  // (Summen statt Prozent-Score) nicht zutrifft. Siehe Migration 0037.
  const { data } = await supabase
    .from("assessments")
    .select(
      "id, created_at, total_score, scores, company_name, template_id, assessment_templates!inner(sections, scoring_mode, tier_low_max, tier_medium_max)",
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .eq("assessment_templates.scoring_mode", "dimension_average")
    .order("created_at", { ascending: false });

  const assessments = (data ?? []) as unknown as CompletedAssessment[];
  const latest = assessments[0];

  // Modus-unabhängige Übersicht der letzten Checks - ergänzt die
  // Dimension-KPIs oben, die nur dimension_average abdecken, damit
  // section_sum-/Radar-Ergebnisse im Cockpit nicht unsichtbar bleiben.
  const { data: recentData } = await supabase
    .from("assessments")
    .select("id, created_at, total_score, assessment_templates(title)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);
  const recentAssessments = (recentData ?? []) as unknown as RecentAssessment[];

  const recentSection = recentAssessments.length > 0 && (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        Deine letzten Checks
      </h2>
      <div className="flex flex-col gap-3">
        {recentAssessments.map((assessment) => (
          <Link
            key={assessment.id}
            href={`/assessment/result?id=${assessment.id}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">
                {assessment.assessment_templates?.title ?? "Check"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(assessment.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {assessment.total_score ?? "—"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );

  // Geführte Onboarding-Checkliste: rein aus vorhandenen Daten
  // abgeleitet, keine eigene "erledigt"-Persistenz. Verschwindet von
  // selbst, sobald alle Schritte erfüllt sind.
  const [teamAssignmentResult, roadmapItemResult, qualifiedRequestResult, ownRequestResult] =
    await Promise.all([
      supabase
        .from("org_assignments")
        .select("child_user_id", { count: "exact", head: true })
        .eq("child_user_id", user.id),
      user.organizationId
        ? supabase
            .from("roadmap_items")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", user.organizationId)
        : Promise.resolve({ count: 0 }),
      user.organizationId
        ? supabase
            .from("change_requests")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", user.organizationId)
            .in("status", ["qualified", "it_backlog", "in_implementation", "done"])
        : Promise.resolve({ count: 0 }),
      supabase
        .from("change_requests")
        .select("id", { count: "exact", head: true })
        .eq("requested_by", user.id),
    ]);

  const onboardingSteps: OnboardingStep[] = [
    {
      label: "Ersten Check abschließen",
      done: recentAssessments.length > 0,
      href: "/assessment",
      actionLabel: "Check starten",
    },
    {
      label: "Eigene Führungskraft zuordnen",
      done: (teamAssignmentResult.count ?? 0) > 0,
      href: "/settings/team",
      actionLabel: "Team einrichten",
    },
    {
      label: "Roadmap-Eintrag anlegen oder qualifizieren lassen",
      done: (roadmapItemResult.count ?? 0) > 0 || (qualifiedRequestResult.count ?? 0) > 0,
      href: "/roadmap",
      actionLabel: "Zur Roadmap",
    },
    {
      label: "Erste Change-Anfrage einreichen",
      done: (ownRequestResult.count ?? 0) > 0,
      href: "/change-requests/new",
      actionLabel: "Idee einreichen",
    },
  ];
  const onboardingSection = onboardingSteps.some((s) => !s.done) && (
    <OnboardingChecklist steps={onboardingSteps} />
  );

  const kpiSection = kpiValues && visibleKpiIds.length > 0 && (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">Überblick</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleKpiIds.map((id) => (
          <CockpitKpiTile
            key={id}
            label={COCKPIT_KPI_LABELS[id]}
            value={kpiValues[id]}
            href={COCKPIT_KPI_HREFS[id]}
          />
        ))}
      </div>
    </section>
  );

  if (!latest) {
    return (
      <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <div className="flex w-full max-w-4xl flex-col gap-10">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Adoptions-Cockpit
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Willkommen in deinem Cockpit
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sobald du deinen ersten Check abgeschlossen hast,
              siehst du hier deine Kennzahlen und Impulse.
            </p>
            <Button size="lg" render={<Link href="/assessment" />}>
              Check starten
            </Button>
          </div>
          {onboardingSection}
          {kpiSection}
          {recentSection}
        </div>
      </div>
    );
  }

  const sections = latest.assessment_templates?.sections ?? [];
  const dimensionScores = sections.map((section) => ({
    section,
    score: latest.scores[section.key],
  }));
  const strongest = dimensionScores.reduce((a, b) => (b.score > a.score ? b : a));
  const weakest = dimensionScores.reduce((a, b) => (b.score < a.score ? b : a));
  const tierLowMax = latest.assessment_templates?.tier_low_max;
  const tierMediumMax = latest.assessment_templates?.tier_medium_max;
  const tier = getScoreTier(latest.total_score, tierLowMax, tierMediumMax);

  let recommendations: TemplateRecommendations | null = null;
  if (latest.template_id) {
    const { data: templateRow } = await supabase
      .from("assessment_templates")
      .select("recommendations")
      .eq("id", latest.template_id)
      .maybeSingle();
    if (templateRow?.recommendations) {
      recommendations = templateRow.recommendations as TemplateRecommendations;
    }
  }
  const weakestRecommendation =
    recommendations?.bySection?.[weakest.section.key]?.[
      getScoreTier(weakest.score, tierLowMax, tierMediumMax)
    ];

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Adoptions-Cockpit
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            {latest.company_name
              ? `Willkommen zurück, ${latest.company_name}`
              : "Willkommen zurück"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stand:{" "}
            {new Date(latest.created_at).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {onboardingSection}

        {kpiSection}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Readiness-Score"
            value={`${latest.total_score}`}
            sublabel={SCORE_TIER_LABELS[tier]}
          />
          <KpiCard
            label="Stärkste Dimension"
            value={`${strongest.score}`}
            sublabel={strongest.section.label}
          />
          <KpiCard
            label="Größter Hebel"
            value={`${weakest.score}`}
            sublabel={weakest.section.label}
          />
          <KpiCard
            label="Checks"
            value={`${assessments.length}`}
            sublabel="Durchgeführt"
          />
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            Impulse für dich
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Nächster Fokus: {weakest.section.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {weakestRecommendation && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {weakestRecommendation}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                render={<Link href="/roadmap" />}
              >
                Zur Roadmap
              </Button>
            </CardContent>
          </Card>
        </section>

        {recentSection}

        <div className="flex justify-end">
          <Button variant="outline" render={<Link href="/assessment" />}>
            Neuen Check starten
          </Button>
        </div>
      </div>
    </div>
  );
}
