"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RadialScore } from "./radial-score";
import { DimensionCard } from "./dimension-card";
import { Button } from "@/components/ui/button";
import {
  ASSESSMENT_DIMENSIONS,
  type AssessmentScores,
  type TemplateBenchmark,
} from "@/types/assessment";
import { getScoreTier, SCORE_TIER_LABELS } from "@/data/result-copy";
import type { TemplateRecommendations } from "@/types/template";

export const RESULT_STORAGE_KEY = "adoptioncockpit_last_result";

export interface StoredResult {
  totalScore: number;
  scores: AssessmentScores;
  companyName?: string | null;
}

interface AssessmentResultViewProps {
  initialResult: StoredResult | null;
  isAuthenticated: boolean;
  completedAt?: string | null;
  benchmark?: TemplateBenchmark | null;
  recommendations?: TemplateRecommendations | null;
}

export function AssessmentResultView({
  initialResult,
  isAuthenticated,
  completedAt,
  benchmark,
  recommendations,
}: AssessmentResultViewProps) {
  const router = useRouter();
  const [result, setResult] = useState<StoredResult | null>(initialResult);
  const [checkedStorage, setCheckedStorage] = useState(Boolean(initialResult));

  useEffect(() => {
    if (initialResult) return;
    const stored = window.sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (stored) {
      try {
        // Fallback für Gäste: Ergebnis wurde vor dem Redirect im
        // sessionStorage abgelegt, da anonyme Nutzer es nicht per RLS aus
        // der DB nachladen können.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResult(JSON.parse(stored) as StoredResult);
      } catch {
        window.sessionStorage.removeItem(RESULT_STORAGE_KEY);
      }
    }
    setCheckedStorage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (checkedStorage && !result) {
      router.replace("/");
    }
  }, [checkedStorage, result, router]);

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <p className="text-sm text-muted-foreground">Lade Ergebnis…</p>
      </div>
    );
  }

  const tier = getScoreTier(result.totalScore);
  const overallRecommendation = recommendations?.overall?.[tier];
  const scoreDiff = benchmark ? result.totalScore - benchmark.medianTotalScore : null;

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Dein KI-Readiness-Ergebnis
          </span>
          {result.companyName && (
            <span className="text-sm text-muted-foreground">
              {result.companyName}
            </span>
          )}
        </div>

        <RadialScore value={result.totalScore}>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-semibold tabular-nums text-foreground">
              {result.totalScore}
            </span>
            <span className="text-sm text-muted-foreground">von 100</span>
          </div>
        </RadialScore>

        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {SCORE_TIER_LABELS[tier]}
          </span>
          {overallRecommendation && (
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              {overallRecommendation}
            </p>
          )}
        </div>

        {benchmark && scoreDiff !== null && (
          <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 px-5 py-3">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Vergleich (gleicher Check)
            </span>
            <span className="text-sm text-foreground">
              Median: <span className="font-medium">{benchmark.medianTotalScore}</span>
              {" · "}
              Du liegst{" "}
              <span className="font-medium">
                {scoreDiff >= 0
                  ? `${scoreDiff} Punkte über`
                  : `${Math.abs(scoreDiff)} Punkte unter`}
              </span>{" "}
              dem Durchschnitt
            </span>
            <span className="text-xs text-muted-foreground">
              Basis: {benchmark.sampleSize} registrierte Teilnehmende
            </span>
          </div>
        )}

        {completedAt && (
          <p className="text-xs text-muted-foreground">
            Abgeschlossen am{" "}
            {new Date(completedAt).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {ASSESSMENT_DIMENSIONS.map((dimension) => {
          const dimensionScore = result.scores[dimension];
          const dimensionTier = getScoreTier(dimensionScore);
          return (
            <DimensionCard
              key={dimension}
              dimension={dimension}
              score={dimensionScore}
              recommendation={recommendations?.byDimension?.[dimension]?.[dimensionTier]}
              benchmarkScore={benchmark?.medianByDimension[dimension]}
            />
          );
        })}
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Bereit für den nächsten Schritt?
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Auf Basis deines Ergebnisses erstellen wir dir eine priorisierte
          Roadmap mit konkreten Maßnahmen für dein Unternehmen.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/roadmap" />}>
            Deep-Dive / Roadmap anfragen
          </Button>
          {isAuthenticated ? (
            <Button size="lg" variant="outline" render={<Link href="/cockpit" />}>
              Zum Adoptions-Cockpit
            </Button>
          ) : (
            <Button size="lg" variant="outline" render={<Link href="/register" />}>
              Ergebnis dauerhaft sichern
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
