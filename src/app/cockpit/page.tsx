import Link from "next/link";
import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KpiCard } from "@/components/cockpit/kpi-card";
import {
  ASSESSMENT_DIMENSIONS,
  ASSESSMENT_DIMENSION_LABELS,
  type AssessmentScores,
} from "@/types/assessment";
import { getScoreTier, SCORE_TIER_LABELS } from "@/data/result-copy";
import type { TemplateRecommendations } from "@/types/template";

interface CompletedAssessment {
  id: string;
  created_at: string;
  total_score: number;
  scores: AssessmentScores;
  company_name: string | null;
  template_id: string | null;
}

export default async function CockpitPage() {
  const user = await requireUser("/cockpit");

  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("id, created_at, total_score, scores, company_name, template_id")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const assessments = (data ?? []) as CompletedAssessment[];
  const latest = assessments[0];

  if (!latest) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Adoptions-Cockpit
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Willkommen in deinem Cockpit
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sobald du deinen ersten KI-Readiness-Check abgeschlossen hast,
            siehst du hier deine Kennzahlen und Impulse.
          </p>
          <Button size="lg" render={<Link href="/assessment" />}>
            Check starten
          </Button>
        </div>
      </div>
    );
  }

  const dimensionScores = ASSESSMENT_DIMENSIONS.map((dimension) => ({
    dimension,
    score: latest.scores[dimension],
  }));
  const strongest = dimensionScores.reduce((a, b) => (b.score > a.score ? b : a));
  const weakest = dimensionScores.reduce((a, b) => (b.score < a.score ? b : a));
  const tier = getScoreTier(latest.total_score);

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
    recommendations?.byDimension?.[weakest.dimension]?.[getScoreTier(weakest.score)];

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Readiness-Score"
            value={`${latest.total_score}`}
            sublabel={SCORE_TIER_LABELS[tier]}
          />
          <KpiCard
            label="Stärkste Dimension"
            value={`${strongest.score}`}
            sublabel={ASSESSMENT_DIMENSION_LABELS[strongest.dimension]}
          />
          <KpiCard
            label="Größter Hebel"
            value={`${weakest.score}`}
            sublabel={ASSESSMENT_DIMENSION_LABELS[weakest.dimension]}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Nächster Fokus: {ASSESSMENT_DIMENSION_LABELS[weakest.dimension]}
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
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Branchenvergleich
                </CardTitle>
                <CardDescription>Bald verfügbar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Vergleiche dein Ergebnis künftig mit anderen Unternehmen
                  deiner Branche und Größe.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="flex justify-end">
          <Button variant="outline" render={<Link href="/assessment" />}>
            Neuen Check starten
          </Button>
        </div>
      </div>
    </div>
  );
}
