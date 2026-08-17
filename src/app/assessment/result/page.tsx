import { createClient } from "@/lib/supabase/server";
import {
  AssessmentResultView,
  type ResultTemplateConfig,
  type StoredResult,
} from "@/components/assessment/assessment-result-view";
import type { ScoreTrendPoint } from "@/components/assessment/score-trend";
import type { AssessmentScores, TemplateBenchmark, TemplateSection } from "@/types/assessment";
import type { AssessmentTemplateRow, TemplateRecommendations } from "@/types/template";
import type { AssessmentQuestion } from "@/data/questions";

const MAX_TREND_POINTS = 10;

const MIN_BENCHMARK_SAMPLE_SIZE = 5;

export default async function AssessmentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; templateId?: string }>;
}) {
  const { id, templateId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialResult: StoredResult | null = null;
  let completedAt: string | null = null;
  let benchmark: TemplateBenchmark | null = null;
  let effectiveTemplateId: string | null = templateId ?? null;

  if (user && id) {
    const { data } = await supabase
      .from("assessments")
      .select("total_score, scores, company_name, created_at, template_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data && data.total_score !== null && data.scores) {
      initialResult = {
        totalScore: data.total_score,
        scores: data.scores as AssessmentScores,
        companyName: data.company_name,
      };
      completedAt = data.created_at;
      effectiveTemplateId = data.template_id;
    }
  }

  // Verlauf: frühere abgeschlossene Durchläufe desselben Templates durch
  // denselben Nutzer, für die Trend-Anzeige. Nur für angemeldete Nutzer
  // sinnvoll - Gäste haben keine dauerhaft verknüpfte Historie.
  let trendPoints: ScoreTrendPoint[] = [];
  if (user && effectiveTemplateId) {
    const { data: historyRows } = await supabase
      .from("assessments")
      .select("created_at, total_score")
      .eq("user_id", user.id)
      .eq("template_id", effectiveTemplateId)
      .eq("status", "completed")
      .order("created_at", { ascending: true })
      .limit(MAX_TREND_POINTS);

    trendPoints = (historyRows ?? [])
      .filter((row) => row.total_score !== null)
      .map((row) => ({
        date: new Date(row.created_at).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        }),
        score: row.total_score as number,
      }));
  }

  let recommendations: TemplateRecommendations | null = null;
  let templateConfig: ResultTemplateConfig | null = null;
  if (effectiveTemplateId) {
    const { data: templateRow } = await supabase
      .from("assessment_templates")
      .select(
        "recommendations, scoring_mode, scale_min, scale_max, result_visualization, sections, questions, tier_low_max, tier_medium_max, section_sum_high_threshold",
      )
      .eq("id", effectiveTemplateId)
      .maybeSingle();

    if (templateRow) {
      const template = templateRow as Pick<
        AssessmentTemplateRow,
        | "recommendations"
        | "scoring_mode"
        | "scale_min"
        | "scale_max"
        | "result_visualization"
        | "sections"
        | "questions"
        | "tier_low_max"
        | "tier_medium_max"
        | "section_sum_high_threshold"
      >;

      if (template.recommendations) {
        recommendations = template.recommendations;
      }

      const questions = template.questions as unknown as AssessmentQuestion[];
      const sections = template.sections as unknown as TemplateSection[];
      const questionCountBySection: Record<string, number> = {};
      for (const section of sections) {
        questionCountBySection[section.key] = questions.filter(
          (q) => q.sectionKey === section.key,
        ).length;
      }
      templateConfig = {
        scoringMode: template.scoring_mode,
        resultVisualization: template.result_visualization,
        scaleMin: template.scale_min,
        scaleMax: template.scale_max,
        sections,
        questionCountBySection,
        totalQuestionCount: questions.length,
        tierLowMax: template.tier_low_max,
        tierMediumMax: template.tier_medium_max,
        sectionSumHighThreshold: template.section_sum_high_threshold,
      };

      // Der Benchmark-RPC liefert nur Mediane für die 4 festen
      // KI-Readiness-Sektionen und ist damit nur für dimension_average-
      // Templates sinnvoll (siehe Migration 0037).
      if (
        user &&
        id &&
        template.scoring_mode === "dimension_average" &&
        effectiveTemplateId
      ) {
        const { data: benchmarkRows } = await supabase.rpc(
          "get_template_benchmark",
          { p_template_id: effectiveTemplateId },
        );
        const row = benchmarkRows?.[0];

        if (
          row &&
          Number(row.sample_size) >= MIN_BENCHMARK_SAMPLE_SIZE &&
          row.median_total_score !== null
        ) {
          benchmark = {
            sampleSize: Number(row.sample_size),
            medianTotalScore: Math.round(Number(row.median_total_score)),
            medianBySection: {
              datenqualitaet: Math.round(Number(row.median_datenqualitaet ?? 0)),
              prozessklarheit: Math.round(Number(row.median_prozessklarheit ?? 0)),
              kulturelle_akzeptanz: Math.round(
                Number(row.median_kulturelle_akzeptanz ?? 0),
              ),
              governance_compliance: Math.round(
                Number(row.median_governance_compliance ?? 0),
              ),
            },
          };
        }
      }
    }
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <AssessmentResultView
          initialResult={initialResult}
          isAuthenticated={Boolean(user)}
          completedAt={completedAt}
          benchmark={benchmark}
          recommendations={recommendations}
          templateConfig={templateConfig}
          trendPoints={trendPoints}
        />
      </div>
    </div>
  );
}
