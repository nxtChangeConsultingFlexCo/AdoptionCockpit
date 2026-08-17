import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/cockpit/kpi-card";
import {
  NeedCapabilityMatrix,
  type MatrixAxisValue,
} from "@/components/cockpit/need-capability-matrix";
import { getScoreTier, SCORE_TIER_LABELS, type ScoreTier } from "@/data/result-copy";
import type { AssessmentQuestion } from "@/data/questions";
import type { AssessmentScores, TemplateSection } from "@/types/assessment";

// Slug-basierte Kopplung der beiden komplementären SAP-Templates - bewusst
// hart codiert statt einer generischen Template-Beziehungs-Verwaltung
// (siehe Erweiterungs-Roadmap-Artefakt, Vorschlag 2).
const NEED_SLUG = "change-management-bedarf";
const CAPABILITY_SLUG = "organisations-change-faehigkeiten";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function loadAxisValue(
  supabase: SupabaseServerClient,
  slug: string,
): Promise<MatrixAxisValue | null> {
  const { data: template } = await supabase
    .from("assessment_templates")
    .select("id, scale_min, scale_max, questions")
    .eq("slug", slug)
    .maybeSingle();
  if (!template) return null;

  const { data: assessment } = await supabase
    .from("assessments")
    .select("total_score")
    .eq("template_id", template.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!assessment || assessment.total_score === null) return null;

  const questionCount = (template.questions as unknown as AssessmentQuestion[]).length;
  return {
    score: assessment.total_score,
    min: questionCount * template.scale_min,
    max: questionCount * template.scale_max,
  };
}

interface LatestDimensionAssessment {
  total_score: number;
  scores: AssessmentScores;
  assessment_templates: {
    sections: TemplateSection[];
    tier_low_max: number | null;
    tier_medium_max: number | null;
  } | null;
}

export default async function SponsorPage() {
  await requireRole(["client_admin", "steering_committee"], "/sponsor");
  const supabase = await createClient();

  const [need, capability] = await Promise.all([
    loadAxisValue(supabase, NEED_SLUG),
    loadAxisValue(supabase, CAPABILITY_SLUG),
  ]);

  // Größter Hebel: neuestes abgeschlossenes dimension_average-Assessment
  // der gesamten Organisation (RLS scoped bereits org-weit für
  // client_admin/steering_committee, siehe Migrationen 0021/0030).
  const { data: latestRows } = await supabase
    .from("assessments")
    .select(
      "total_score, scores, assessment_templates!inner(sections, scoring_mode, tier_low_max, tier_medium_max)",
    )
    .eq("status", "completed")
    .eq("assessment_templates.scoring_mode", "dimension_average")
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = (latestRows?.[0] ?? null) as unknown as LatestDimensionAssessment | null;
  let weakest: { label: string; score: number } | null = null;
  let overallTier: ScoreTier | null = null;
  if (latest) {
    const sections = latest.assessment_templates?.sections ?? [];
    const dimensionScores = sections.map((section) => ({
      section,
      score: latest.scores[section.key] ?? 0,
    }));
    if (dimensionScores.length > 0) {
      const weakestEntry = dimensionScores.reduce((a, b) => (b.score < a.score ? b : a));
      weakest = { label: weakestEntry.section.label, score: weakestEntry.score };
    }
    overallTier = getScoreTier(
      latest.total_score,
      latest.assessment_templates?.tier_low_max,
      latest.assessment_templates?.tier_medium_max,
    );
  }

  const { data: milestoneRows } = await supabase
    .from("change_requests")
    .select("id, title, phase, target_date")
    .in("status", ["qualified", "it_backlog", "in_implementation"])
    .not("target_date", "is", null)
    .order("target_date", { ascending: true })
    .limit(3);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Sponsor-Ansicht
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Überblick für Entscheider:innen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kuratierte Zusammenfassung eures Change-Fortschritts – für die
            nächste Steering-Committee-Sitzung.
          </p>
        </div>

        {latest && (
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Readiness-Score"
              value={`${latest.total_score}`}
              sublabel={overallTier ? SCORE_TIER_LABELS[overallTier] : undefined}
            />
            {weakest && (
              <KpiCard
                label="Größter Hebel"
                value={`${weakest.score}`}
                sublabel={weakest.label}
              />
            )}
          </div>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Bedarf × Fähigkeit</h2>
          <NeedCapabilityMatrix need={need} capability={capability} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Nächste Meilensteine</h2>
          {!milestoneRows || milestoneRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
              Keine eingeplanten Meilensteine.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {milestoneRows.map((milestone) => (
                <Link
                  key={milestone.id}
                  href={`/change-requests/${milestone.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">{milestone.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {milestone.phase ?? "Ohne Phase"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(milestone.target_date)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
