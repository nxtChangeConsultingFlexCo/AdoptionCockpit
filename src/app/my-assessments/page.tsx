import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssessmentQuestion } from "@/data/questions";
import type { ScoringMode } from "@/types/template";

const SORT_OPTIONS = {
  newest: "Neueste zuerst",
  oldest: "Älteste zuerst",
  score: "Score (hoch zuerst)",
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface MyAssessment {
  id: string;
  total_score: number | null;
  created_at: string;
  assessment_templates: {
    title: string;
    scoring_mode: ScoringMode;
    scale_max: number;
    questions: AssessmentQuestion[];
  } | null;
}

function scoreMaxLabel(template: MyAssessment["assessment_templates"]): string {
  if (!template) return "100";
  if (template.scoring_mode === "dimension_average") return "100";
  return String(template.questions.length * template.scale_max);
}

export default async function MyAssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const user = await requireUser("/my-assessments");
  if (user.role === "god") {
    redirect("/admin");
  }
  const { sort, q } = await searchParams;
  const sortKey: SortKey = sort && sort in SORT_OPTIONS ? (sort as SortKey) : "newest";

  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select(
      "id, total_score, created_at, assessment_templates(title, scoring_mode, scale_max, questions)",
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: sortKey === "oldest" });

  const allAssessments = (data ?? []) as unknown as MyAssessment[];
  let assessments = allAssessments;
  if (q?.trim()) {
    const term = q.trim().toLowerCase();
    assessments = assessments.filter((a) =>
      (a.assessment_templates?.title ?? "").toLowerCase().includes(term),
    );
  }
  if (sortKey === "score") {
    assessments = [...assessments].sort(
      (a, b) => (b.total_score ?? -1) - (a.total_score ?? -1),
    );
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Übersicht
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              Meine Checks
            </h1>
          </div>
          <Button render={<Link href="/" />}>Neuen Check starten</Button>
        </div>

        {allAssessments.length > 0 && (
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-1 flex-col gap-1 sm:max-w-xs">
              <label htmlFor="q" className="text-xs text-muted-foreground">
                Suche
              </label>
              <Input id="q" name="q" defaultValue={q ?? ""} placeholder="Check-Name…" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sort" className="text-xs text-muted-foreground">
                Sortierung
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sortKey}
                className={selectClassName}
              >
                {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline" size="sm">
              Anwenden
            </Button>
          </form>
        )}

        {assessments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {allAssessments.length === 0
                ? "Du hast noch keinen Check abgeschlossen."
                : "Keine Checks gefunden."}
            </p>
            {allAssessments.length === 0 && (
              <Button variant="outline" render={<Link href="/" />}>
                Ersten Check starten
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {assessments.map((assessment) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    {assessment.total_score ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {scoreMaxLabel(assessment.assessment_templates)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
