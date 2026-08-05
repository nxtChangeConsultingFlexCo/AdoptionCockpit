import { createClient } from "@/lib/supabase/server";
import {
  AssessmentResultView,
  type StoredResult,
} from "@/components/assessment/assessment-result-view";
import type { AssessmentScores, TemplateBenchmark } from "@/types/assessment";
import type { TemplateRecommendations } from "@/types/template";

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

      if (data.template_id) {
        const { data: benchmarkRows } = await supabase.rpc(
          "get_template_benchmark",
          { p_template_id: data.template_id },
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
            medianByDimension: {
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

  let recommendations: TemplateRecommendations | null = null;
  if (effectiveTemplateId) {
    const { data: templateRow } = await supabase
      .from("assessment_templates")
      .select("recommendations")
      .eq("id", effectiveTemplateId)
      .maybeSingle();

    if (templateRow?.recommendations) {
      recommendations = templateRow.recommendations as TemplateRecommendations;
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
        />
      </div>
    </div>
  );
}
