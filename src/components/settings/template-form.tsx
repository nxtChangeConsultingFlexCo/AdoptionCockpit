"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { createTemplate, updateTemplate } from "@/app/settings/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TemplatePreview } from "./template-preview";
import type { TemplateSection } from "@/types/assessment";
import {
  SCORE_TIERS,
  SCORE_TIER_LABELS,
  SECTION_SUM_TIERS,
  SECTION_SUM_TIER_LABELS,
} from "@/data/result-copy";
import type { AssessmentQuestion } from "@/data/questions";
import {
  validateTemplateInput,
  type TemplateInput,
  type TemplateValidationError,
} from "@/lib/template-validation";
import type {
  AssessmentTemplateRow,
  ResultVisualization,
  ScoringMode,
  TemplateRecommendations,
} from "@/types/template";

const SCORING_MODE_OPTIONS: { value: ScoringMode; label: string }[] = [
  { value: "dimension_average", label: "Durchschnitt je Sektion (0–100, 3 Stufen)" },
  { value: "section_sum", label: "Summe je Sektion (2 Stufen: gering/hoch)" },
];

const RESULT_VISUALIZATION_OPTIONS: { value: ResultVisualization; label: string }[] = [
  { value: "bars", label: "Balken je Sektion" },
  { value: "radar", label: "Spinnennetz-Diagramm (ab 3 Sektionen sinnvoll)" },
];

function tiersForMode(mode: ScoringMode): readonly string[] {
  return mode === "section_sum" ? SECTION_SUM_TIERS : SCORE_TIERS;
}

function tierLabel(mode: ScoringMode, tier: string): string {
  if (mode === "section_sum") {
    return SECTION_SUM_TIER_LABELS[tier as (typeof SECTION_SUM_TIERS)[number]];
  }
  return SCORE_TIER_LABELS[tier as (typeof SCORE_TIERS)[number]];
}

function emptyRecommendations(sections: TemplateSection[]): TemplateRecommendations {
  return {
    bySection: Object.fromEntries(sections.map((s) => [s.key, {}])),
    overall: {},
  };
}

function swap<T>(list: T[], a: number, b: number): T[] {
  if (a < 0 || b < 0 || a >= list.length || b >= list.length) return list;
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

const textareaClassName =
  "flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const invalidClassName = "border-destructive focus-visible:ring-destructive/30";

interface TemplateFormProps {
  template?: AssessmentTemplateRow;
}

export function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(template?.sort_order ?? 0);
  const [scoringMode, setScoringMode] = useState<ScoringMode>(
    template?.scoring_mode ?? "dimension_average",
  );
  const [scaleMin, setScaleMin] = useState(template?.scale_min ?? 1);
  const [scaleMax, setScaleMax] = useState(template?.scale_max ?? 5);
  const [resultVisualization, setResultVisualization] = useState<ResultVisualization>(
    template?.result_visualization ?? "bars",
  );
  const [tierLowMax, setTierLowMax] = useState<number | null>(
    template?.tier_low_max ?? null,
  );
  const [tierMediumMax, setTierMediumMax] = useState<number | null>(
    template?.tier_medium_max ?? null,
  );
  const [sectionSumHighThreshold, setSectionSumHighThreshold] = useState<number | null>(
    template?.section_sum_high_threshold ?? null,
  );
  const [sections, setSections] = useState<TemplateSection[]>(template?.sections ?? []);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(
    template?.questions ?? [],
  );
  const [recommendations, setRecommendations] = useState<TemplateRecommendations>(() => {
    const base = emptyRecommendations(template?.sections ?? []);
    if (!template?.recommendations) return base;
    return {
      bySection: { ...base.bySection, ...template.recommendations.bySection },
      overall: { ...base.overall, ...template.recommendations.overall },
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentInput: TemplateInput = {
    title,
    description,
    slug,
    scoringMode,
    scaleMin,
    scaleMax,
    resultVisualization,
    tierLowMax,
    tierMediumMax,
    sectionSumHighThreshold,
    sections,
    questions,
    isActive,
    sortOrder,
    recommendations,
  };

  const validationErrors = useMemo(
    () => validateTemplateInput(currentInput),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      title,
      slug,
      scoringMode,
      scaleMin,
      scaleMax,
      tierLowMax,
      tierMediumMax,
      sections,
      questions,
    ],
  );

  function errorFor(field: string): TemplateValidationError | undefined {
    if (!hasAttemptedSubmit) return undefined;
    return validationErrors.find((e) => e.field === field);
  }

  function updateSection(index: number, patch: Partial<TemplateSection>) {
    const current = sections[index];
    const nextKey = patch.key ?? current.key;

    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

    if (patch.key !== undefined && patch.key !== current.key) {
      // Referenzen in Fragen und Empfehlungen mitziehen, damit eine
      // Umbenennung des Sektions-Keys die bestehende Zuordnung nicht bricht.
      setQuestions((qs) =>
        qs.map((q) => (q.sectionKey === current.key ? { ...q, sectionKey: nextKey } : q)),
      );
      setRecommendations((r) => {
        if (!(current.key in r.bySection)) return r;
        const { [current.key]: moved, ...rest } = r.bySection;
        return { ...r, bySection: { ...rest, [nextKey]: moved } };
      });
    }
  }

  function addSection() {
    setSections((prev) => [...prev, { key: "", label: "" }]);
  }

  function removeSection(index: number) {
    const section = sections[index];
    setSections((prev) => prev.filter((_, i) => i !== index));
    setRecommendations((r) => {
      if (!section || !(section.key in r.bySection)) return r;
      const bySection = { ...r.bySection };
      delete bySection[section.key];
      return { ...r, bySection };
    });
  }

  function moveSection(index: number, direction: -1 | 1) {
    setSections((prev) => swap(prev, index, index + direction));
  }

  function updateOverallRecommendation(tier: string, value: string) {
    setRecommendations((prev) => ({
      ...prev,
      overall: { ...prev.overall, [tier]: value },
    }));
  }

  function updateSectionRecommendation(sectionKey: string, tier: string, value: string) {
    setRecommendations((prev) => ({
      ...prev,
      bySection: {
        ...prev.bySection,
        [sectionKey]: { ...prev.bySection[sectionKey], [tier]: value },
      },
    }));
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: "", sectionKey: sections[0]?.key ?? "", text: "" },
    ]);
  }

  function updateQuestion(index: number, patch: Partial<AssessmentQuestion>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    setQuestions((prev) => swap(prev, index, index + direction));
  }

  function handleSubmit() {
    setError(null);
    setHasAttemptedSubmit(true);

    const errors = validateTemplateInput(currentInput);
    if (errors.length > 0) {
      setError(errors[0].message);
      return;
    }

    startTransition(async () => {
      const res = template
        ? await updateTemplate(template.id, currentInput)
        : await createTemplate(currentInput);

      if (res.error) {
        setError(res.error);
        return;
      }
      router.push("/settings/templates");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setViewMode("edit")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            viewMode === "edit"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            viewMode === "preview"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Vorschau
        </button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {viewMode === "preview" ? (
        <TemplatePreview
          title={title}
          description={description}
          sections={sections}
          questions={questions}
          scaleMin={scaleMin}
          scaleMax={scaleMax}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={Boolean(errorFor("title"))}
                className={errorFor("title") ? invalidClassName : undefined}
              />
              {errorFor("title") && (
                <p className="text-xs text-destructive">{errorFor("title")?.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="z. B. ki-readiness"
                aria-invalid={Boolean(errorFor("slug"))}
                className={errorFor("slug") ? invalidClassName : undefined}
              />
              {errorFor("slug") && (
                <p className="text-xs text-destructive">{errorFor("slug")?.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Beschreibung</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={textareaClassName}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="is_active" className="font-normal">
                Aktiv (auf der Startseite sichtbar)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sort_order" className="font-normal">
                Reihenfolge
              </Label>
              <Input
                id="sort_order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scoring_mode">Auswertungsart</Label>
                <select
                  id="scoring_mode"
                  value={scoringMode}
                  onChange={(e) => setScoringMode(e.target.value as ScoringMode)}
                  className={selectClassName}
                >
                  {SCORING_MODE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scale_min">Skala von</Label>
                <Input
                  id="scale_min"
                  type="number"
                  value={scaleMin}
                  onChange={(e) => setScaleMin(Number(e.target.value))}
                  aria-invalid={Boolean(errorFor("scale"))}
                  className={errorFor("scale") ? invalidClassName : undefined}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scale_max">Skala bis</Label>
                <Input
                  id="scale_max"
                  type="number"
                  value={scaleMax}
                  onChange={(e) => setScaleMax(Number(e.target.value))}
                  aria-invalid={Boolean(errorFor("scale"))}
                  className={errorFor("scale") ? invalidClassName : undefined}
                />
              </div>
            </div>
            {errorFor("scale") && (
              <p className="text-xs text-destructive">{errorFor("scale")?.message}</p>
            )}

            {scoringMode === "dimension_average" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tier_low_max">
                    Tier-Grenze niedrig (optional)
                  </Label>
                  <Input
                    id="tier_low_max"
                    type="number"
                    value={tierLowMax ?? ""}
                    onChange={(e) =>
                      setTierLowMax(e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="Standard: 40"
                    aria-invalid={Boolean(errorFor("tierThresholds"))}
                    className={errorFor("tierThresholds") ? invalidClassName : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    Score darunter gilt als „{SCORE_TIER_LABELS.low}“.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tier_medium_max">
                    Tier-Grenze mittel (optional)
                  </Label>
                  <Input
                    id="tier_medium_max"
                    type="number"
                    value={tierMediumMax ?? ""}
                    onChange={(e) =>
                      setTierMediumMax(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    placeholder="Standard: 70"
                    aria-invalid={Boolean(errorFor("tierThresholds"))}
                    className={errorFor("tierThresholds") ? invalidClassName : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    Score darunter gilt als „{SCORE_TIER_LABELS.medium}“, sonst als „
                    {SCORE_TIER_LABELS.high}“.
                  </p>
                </div>
                {errorFor("tierThresholds") && (
                  <p className="text-xs text-destructive sm:col-span-2">
                    {errorFor("tierThresholds")?.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 sm:w-1/2">
                <Label htmlFor="section_sum_high_threshold">
                  Schwellenwert „hoch“ je Sektion (optional)
                </Label>
                <Input
                  id="section_sum_high_threshold"
                  type="number"
                  value={sectionSumHighThreshold ?? ""}
                  onChange={(e) =>
                    setSectionSumHighThreshold(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  placeholder="Standard: Mittelpunkt des Wertebereichs"
                />
                <p className="text-xs text-muted-foreground">
                  Gilt je Sektion (nicht für die Gesamtsumme): Sektionssumme ab diesem
                  Wert gilt als „{SECTION_SUM_TIER_LABELS.high}“.
                </p>
              </div>
            )}
          </div>

          {scoringMode === "section_sum" && (
            <div className="flex flex-col gap-1.5 sm:w-1/3">
              <Label htmlFor="result_visualization">Ergebnis-Darstellung</Label>
              <select
                id="result_visualization"
                value={resultVisualization}
                onChange={(e) =>
                  setResultVisualization(e.target.value as ResultVisualization)
                }
                className={selectClassName}
              >
                {RESULT_VISUALIZATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                Sektionen ({sections.length})
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addSection}>
                Sektion hinzufügen
              </Button>
            </div>

            {errorFor("sections") && (
              <p className="text-xs text-destructive">{errorFor("sections")?.message}</p>
            )}

            <div className="flex flex-col gap-3">
              {sections.map((section, index) => {
                const sectionError = errorFor(`sections[${index}]`);
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Key</Label>
                        <Input
                          value={section.key}
                          onChange={(e) => updateSection(index, { key: e.target.value })}
                          placeholder="z. B. komplexitaet"
                          aria-invalid={Boolean(sectionError)}
                          className={sectionError ? invalidClassName : undefined}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">Label</Label>
                        <Input
                          value={section.label}
                          onChange={(e) => updateSection(index, { label: e.target.value })}
                          placeholder="z. B. Komplexität des Projekts"
                          aria-invalid={Boolean(sectionError)}
                          className={sectionError ? invalidClassName : undefined}
                        />
                      </div>
                      <div className="flex items-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => moveSection(index, -1)}
                          aria-label="Sektion nach oben verschieben"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === sections.length - 1}
                          onClick={() => moveSection(index, 1)}
                          aria-label="Sektion nach unten verschieben"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(index)}
                        >
                          Entfernen
                        </Button>
                      </div>
                    </div>
                    {sectionError && (
                      <p className="text-xs text-destructive">{sectionError.message}</p>
                    )}
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Gruppe (optional)
                      </Label>
                      <Input
                        value={section.group ?? ""}
                        onChange={(e) =>
                          updateSection(index, { group: e.target.value || undefined })
                        }
                        placeholder="z. B. Allgemeine organisatorische Fähigkeiten"
                      />
                    </div>
                  </div>
                );
              })}
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Sektionen.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">
                Fragen ({questions.length})
              </h2>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                Frage hinzufügen
              </Button>
            </div>

            {errorFor("questions") && (
              <p className="text-xs text-destructive">{errorFor("questions")?.message}</p>
            )}

            <div className="flex flex-col gap-4">
              {questions.map((question, index) => {
                const questionError = errorFor(`questions[${index}]`);
                const sectionKeyError = errorFor(`questions[${index}].sectionKey`);
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">
                          Frage-ID
                        </Label>
                        <Input
                          value={question.id}
                          onChange={(e) =>
                            updateQuestion(index, { id: e.target.value })
                          }
                          placeholder="z. B. dq_1"
                          aria-invalid={Boolean(questionError)}
                          className={questionError ? invalidClassName : undefined}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">
                          Sektion
                        </Label>
                        <select
                          value={question.sectionKey}
                          onChange={(e) =>
                            updateQuestion(index, { sectionKey: e.target.value })
                          }
                          className={`${selectClassName} ${sectionKeyError ? invalidClassName : ""}`}
                        >
                          <option value="">–</option>
                          {sections.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label || s.key}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => moveQuestion(index, -1)}
                          aria-label="Frage nach oben verschieben"
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === questions.length - 1}
                          onClick={() => moveQuestion(index, 1)}
                          aria-label="Frage nach unten verschieben"
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                        >
                          Entfernen
                        </Button>
                      </div>
                    </div>
                    {(questionError || sectionKeyError) && (
                      <p className="text-xs text-destructive">
                        {questionError?.message ?? sectionKeyError?.message}
                      </p>
                    )}
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Fragetext
                      </Label>
                      <textarea
                        value={question.text}
                        onChange={(e) =>
                          updateQuestion(index, { text: e.target.value })
                        }
                        rows={2}
                        className={textareaClassName}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">
                          Label bei Minimalwert (optional)
                        </Label>
                        <Input
                          value={question.lowLabel ?? ""}
                          onChange={(e) =>
                            updateQuestion(index, { lowLabel: e.target.value || undefined })
                          }
                          placeholder="z. B. wenige Mitarbeitende"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs text-muted-foreground">
                          Label bei Maximalwert (optional)
                        </Label>
                        <Input
                          value={question.highLabel ?? ""}
                          onChange={(e) =>
                            updateQuestion(index, { highLabel: e.target.value || undefined })
                          }
                          placeholder="z. B. viele Mitarbeitende"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground">Noch keine Fragen.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                Handlungsempfehlungen
              </h2>
              <p className="text-sm text-muted-foreground">
                Texte je Ergebnis-Stufe – werden im Ergebnis passend zum erreichten
                Wert angezeigt. Optional.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <h3 className="text-sm font-medium text-foreground">
                Gesamtempfehlung (nach Gesamtergebnis)
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {tiersForMode(scoringMode).map((tier) => (
                  <div key={tier} className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      {tierLabel(scoringMode, tier)}
                    </Label>
                    <textarea
                      value={recommendations.overall[tier] ?? ""}
                      onChange={(e) =>
                        updateOverallRecommendation(tier, e.target.value)
                      }
                      rows={3}
                      className={textareaClassName}
                    />
                  </div>
                ))}
              </div>
            </div>

            {sections.map((section, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-lg border border-border p-4"
              >
                <h3 className="text-sm font-medium text-foreground">
                  {section.label || section.key || "Unbenannte Sektion"}
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {tiersForMode(scoringMode).map((tier) => (
                    <div key={tier} className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        {tierLabel(scoringMode, tier)}
                      </Label>
                      <textarea
                        value={recommendations.bySection[section.key]?.[tier] ?? ""}
                        onChange={(e) =>
                          updateSectionRecommendation(section.key, tier, e.target.value)
                        }
                        rows={3}
                        className={textareaClassName}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? "Wird gespeichert…"
            : template
              ? "Speichern"
              : "Template erstellen"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          render={<Link href="/settings/templates" />}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
