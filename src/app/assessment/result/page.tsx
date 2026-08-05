import { createClient } from "@/lib/supabase/server";
import {
  AssessmentResultView,
  type StoredResult,
} from "@/components/assessment/assessment-result-view";
import type { AssessmentScores } from "@/types/assessment";

export default async function AssessmentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialResult: StoredResult | null = null;
  let completedAt: string | null = null;

  if (user && id) {
    const { data } = await supabase
      .from("assessments")
      .select("total_score, scores, company_name, created_at")
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
    }
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <AssessmentResultView
          initialResult={initialResult}
          isAuthenticated={Boolean(user)}
          completedAt={completedAt}
        />
      </div>
    </div>
  );
}
