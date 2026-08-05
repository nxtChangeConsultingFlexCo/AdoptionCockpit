"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createTemplate,
  updateTemplate,
  type TemplateInput,
} from "@/app/settings/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ASSESSMENT_DIMENSIONS,
  ASSESSMENT_DIMENSION_LABELS,
  type AssessmentDimension,
} from "@/types/assessment";
import { SCORE_TIERS, SCORE_TIER_LABELS, type ScoreTier } from "@/data/result-copy";
import type { AssessmentQuestion } from "@/data/questions";
import type {
  AssessmentTemplateRow,
  TemplateRecommendations,
} from "@/types/template";

function emptyRecommendations(): TemplateRecommendations {
  return {
    byDimension: Object.fromEntries(
      ASSESSMENT_DIMENSIONS.map((dim) => [dim, { low: "", medium: "", high: "" }]),
    ) as TemplateRecommendations["byDimension"],
    overall: { low: "", medium: "", high: "" },
  };
}

const textareaClassName =
  "flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";
const selectClassName =
  "flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

interface TemplateFormProps {
  template?: AssessmentTemplateRow;
}

export function TemplateForm({ template }: TemplateFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(template?.title ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [slug, setSlug] = useState(template?.slug ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(template?.sort_order ?? 0);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(
    template?.questions ?? [],
  );
  const [recommendations, setRecommendations] = useState<TemplateRecommendations>(() => {
    const base = emptyRecommendations();
    if (!template?.recommendations) return base;
    return {
      byDimension: {
        ...base.byDimension,
        ...Object.fromEntries(
          ASSESSMENT_DIMENSIONS.map((dim) => [
            dim,
            { ...base.byDimension[dim], ...template.recommendations.byDimension?.[dim] },
          ]),
        ),
      },
      overall: { ...base.overall, ...template.recommendations.overall },
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateDimensionRecommendation(
    dimension: AssessmentDimension,
    tier: ScoreTier,
    value: string,
  ) {
    setRecommendations((prev) => ({
      ...prev,
      byDimension: {
        ...prev.byDimension,
        [dimension]: { ...prev.byDimension[dimension], [tier]: value },
      },
    }));
  }

  function updateOverallRecommendation(tier: ScoreTier, value: string) {
    setRecommendations((prev) => ({
      ...prev,
      overall: { ...prev.overall, [tier]: value },
    }));
  }

  function addQuestion() {
    setQuestions((prev) => [
      ...prev,
      { id: "", dimension: ASSESSMENT_DIMENSIONS[0], text: "" },
    ]);
  }

  function updateQuestion(index: number, patch: Partial<AssessmentQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setError(null);
    const input: TemplateInput = {
      title,
      description,
      slug,
      questions,
      isActive,
      sortOrder,
      recommendations,
    };

    startTransition(async () => {
      const res = template
        ? await updateTemplate(template.id, input)
        : await createTemplate(input);

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
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Titel</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="z. B. ki-readiness"
          />
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">
            Fragen ({questions.length})
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
            Frage hinzufügen
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {questions.map((question, index) => (
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
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">
                    Dimension
                  </Label>
                  <select
                    value={question.dimension}
                    onChange={(e) =>
                      updateQuestion(index, {
                        dimension: e.target
                          .value as AssessmentQuestion["dimension"],
                      })
                    }
                    className={selectClassName}
                  >
                    {ASSESSMENT_DIMENSIONS.map((dim) => (
                      <option key={dim} value={dim}>
                        {ASSESSMENT_DIMENSION_LABELS[dim]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
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
            </div>
          ))}
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
            Texte je Score-Stufe (niedrig / mittel / hoch) – werden im
            Ergebnis passend zum erreichten Score angezeigt. Optional.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">
            Gesamtempfehlung (nach Gesamtscore)
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {SCORE_TIERS.map((tier) => (
              <div key={tier} className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  {SCORE_TIER_LABELS[tier]}
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

        {ASSESSMENT_DIMENSIONS.map((dimension) => (
          <div
            key={dimension}
            className="flex flex-col gap-3 rounded-lg border border-border p-4"
          >
            <h3 className="text-sm font-medium text-foreground">
              {ASSESSMENT_DIMENSION_LABELS[dimension]}
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {SCORE_TIERS.map((tier) => (
                <div key={tier} className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">
                    {SCORE_TIER_LABELS[tier]}
                  </Label>
                  <textarea
                    value={recommendations.byDimension[dimension]?.[tier] ?? ""}
                    onChange={(e) =>
                      updateDimensionRecommendation(dimension, tier, e.target.value)
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
