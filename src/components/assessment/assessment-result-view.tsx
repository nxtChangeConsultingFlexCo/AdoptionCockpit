"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RadialScore } from "./radial-score";
import { DimensionCard } from "./dimension-card";
import { SectionScaleCard } from "./section-scale-card";
import { RadarChart } from "./radar-chart";
import { Button } from "@/components/ui/button";
import type {
  AssessmentScores,
  TemplateBenchmark,
  TemplateSection,
} from "@/types/assessment";
import {
  getScoreTier,
  getSectionSumTier,
  SCORE_TIER_LABELS,
  SECTION_SUM_TIER_LABELS,
} from "@/data/result-copy";
import type {
  ResultVisualization,
  ScoringMode,
  TemplateRecommendations,
} from "@/types/template";

export const RESULT_STORAGE_KEY = "adoptioncockpit_last_result";

export interface StoredResult {
  totalScore: number;
  scores: AssessmentScores;
  companyName?: string | null;
}

export interface ResultTemplateConfig {
  scoringMode: ScoringMode;
  resultVisualization: ResultVisualization;
  scaleMin: number;
  scaleMax: number;
  sections: TemplateSection[];
  questionCountBySection: Record<string, number>;
  totalQuestionCount: number;
  tierLowMax: number | null;
  tierMediumMax: number | null;
  sectionSumHighThreshold: number | null;
}

interface AssessmentResultViewProps {
  initialResult: StoredResult | null;
  isAuthenticated: boolean;
  completedAt?: string | null;
  benchmark?: TemplateBenchmark | null;
  recommendations?: TemplateRecommendations | null;
  templateConfig?: ResultTemplateConfig | null;
}

interface SectionGroup {
  group: string | undefined;
  sections: TemplateSection[];
}

// Fasst Sektionen nach ihrem optionalen group-Feld zusammen (Reihenfolge
// = erstes Vorkommen). Hat kein Sektion ein group gesetzt, entsteht eine
// einzelne Gruppe ohne Überschrift - identisch zum bisherigen, flachen
// Grid.
function groupSections(sections: TemplateSection[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  for (const section of sections) {
    const existing = groups.find((g) => g.group === section.group);
    if (existing) {
      existing.sections.push(section);
    } else {
      groups.push({ group: section.group, sections: [section] });
    }
  }
  return groups;
}

// Fallback für sehr alte Assessments ohne verknüpftes Template (vor
// Migration 0011): Sektionen lassen sich dann nur noch aus den Score-Keys
// ableiten, mit dem Key selbst als Label.
function fallbackSections(scores: AssessmentScores): TemplateSection[] {
  return Object.keys(scores).map((key) => ({ key, label: key }));
}

export function AssessmentResultView({
  initialResult,
  isAuthenticated,
  completedAt,
  benchmark,
  recommendations,
  templateConfig,
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

  const sections = templateConfig?.sections ?? fallbackSections(result.scores);
  const scoringMode = templateConfig?.scoringMode ?? "dimension_average";

  const header = (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        Dein Check-Ergebnis
      </span>
      {result.companyName && (
        <span className="text-sm text-muted-foreground">{result.companyName}</span>
      )}
    </div>
  );

  const footer = (
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
  );

  const completedAtNote = completedAt && (
    <p className="text-xs text-muted-foreground">
      Abgeschlossen am{" "}
      {new Date(completedAt).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}
    </p>
  );

  if (scoringMode === "section_sum" && templateConfig) {
    const totalMin = templateConfig.totalQuestionCount * templateConfig.scaleMin;
    const totalMax = templateConfig.totalQuestionCount * templateConfig.scaleMax;
    // sectionSumHighThreshold ist als Wert auf der Skala einer einzelnen
    // Sektion gedacht (z. B. "20 von 25") und wird deshalb nur je Sektion
    // angewendet, nicht auf die Gesamtsumme - deren Wertebereich ist ein
    // anderer (Summe über alle Sektionen). Die Gesamteinschätzung bleibt
    // beim mathematischen Mittelpunkt.
    const totalTier = getSectionSumTier(result.totalScore, totalMin, totalMax);
    const overallRecommendation = recommendations?.overall?.[totalTier];
    const totalRange = totalMax - totalMin;
    const totalPercent =
      totalRange > 0 ? ((result.totalScore - totalMin) / totalRange) * 100 : 0;
    const clampedTotalPercent = Math.min(100, Math.max(0, totalPercent));
    const isRadar = templateConfig.resultVisualization === "radar";

    const radarAxes = sections.map((section) => ({
      key: section.key,
      label: section.label,
      value: result.scores[section.key] ?? 0,
      max:
        (templateConfig.questionCountBySection[section.key] ?? 0) *
        templateConfig.scaleMax,
    }));

    return (
      <div className="flex flex-col gap-14">
        <section className="flex flex-col items-center gap-6 text-center">
          {header}

          {isRadar ? (
            <div className="flex w-full max-w-sm flex-col items-center gap-4">
              <RadarChart axes={radarAxes} />
              {overallRecommendation && (
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                  {overallRecommendation}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex w-full max-w-md flex-col items-center gap-3">
                <span className="text-5xl font-semibold tabular-nums text-foreground">
                  {result.totalScore}
                </span>
                <span className="text-sm text-muted-foreground">
                  von {totalMin}–{totalMax} Punkten
                </span>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-out"
                    style={{ width: `${clampedTotalPercent}%` }}
                  />
                </div>
                <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                  <span>Geringer Bedarf</span>
                  <span>Hoher Bedarf</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {SECTION_SUM_TIER_LABELS[totalTier]}
                </span>
                {overallRecommendation && (
                  <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                    {overallRecommendation}
                  </p>
                )}
              </div>
            </>
          )}

          {completedAtNote}
        </section>

        <section className="flex flex-col gap-8">
          {groupSections(sections).map((sectionGroup, groupIndex) => (
            <div
              key={sectionGroup.group ?? `ungrouped-${groupIndex}`}
              className="flex flex-col gap-4"
            >
              {sectionGroup.group && (
                <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                  {sectionGroup.group}
                </h3>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {sectionGroup.sections.map((section) => {
                  const sum = result.scores[section.key] ?? 0;
                  const questionCount =
                    templateConfig.questionCountBySection[section.key] ?? 0;
                  const min = questionCount * templateConfig.scaleMin;
                  const max = questionCount * templateConfig.scaleMax;
                  const tier = getSectionSumTier(
                    sum,
                    min,
                    max,
                    templateConfig.sectionSumHighThreshold,
                  );
                  return (
                    <SectionScaleCard
                      key={section.key}
                      label={section.label}
                      value={sum}
                      min={min}
                      max={max}
                      recommendation={recommendations?.bySection?.[section.key]?.[tier]}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {footer}
      </div>
    );
  }

  const tier = getScoreTier(
    result.totalScore,
    templateConfig?.tierLowMax,
    templateConfig?.tierMediumMax,
  );
  const overallRecommendation = recommendations?.overall?.[tier];
  const scoreDiff = benchmark ? result.totalScore - benchmark.medianTotalScore : null;

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col items-center gap-6 text-center">
        {header}

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

        {completedAtNote}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const sectionScore = result.scores[section.key];
          const sectionTier = getScoreTier(
            sectionScore,
            templateConfig?.tierLowMax,
            templateConfig?.tierMediumMax,
          );
          return (
            <DimensionCard
              key={section.key}
              label={section.label}
              score={sectionScore}
              recommendation={recommendations?.bySection?.[section.key]?.[sectionTier]}
              benchmarkScore={benchmark?.medianBySection[section.key]}
            />
          );
        })}
      </section>

      {footer}
    </div>
  );
}
