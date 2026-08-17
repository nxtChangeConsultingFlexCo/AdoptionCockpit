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
import type { TemplateSection } from "@/types/assessment";
import {
  SCORE_TIERS,
  SCORE_TIER_LABELS,
  SECTION_SUM_TIERS,
  SECTION_SUM_TIER_LABELS,
} from "@/data/result-copy";
import type { AssessmentQuestion } from "@/data/questions";
import type {
  AssessmentTemplateRow,
  ScoringMode,
  TemplateRecommendations,
} from "@/types/template";

const SCORING_MODE_OPTIONS: { value: ScoringMode; label: string }[] = [
  { value: "dimension_average", label: "Durchschnitt je Sektion (0–100, 3 Stufen)" },
  { value: "section_sum", label: "Summe je Sektion (2 Stufen: gering/hoch)" },
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
  const [scoringMode, setScoringMode] = useState<ScoringMode>(
    template?.scoring_mode ?? "dimension_average",
  );
  const [scaleMin, setScaleMin] = useState(template?.scale_min ?? 1);
  const [scaleMax, setScaleMax] = useState(template?.scale_max ?? 5);
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
  const [isPending, startTransition] = useTransition();

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

  function handleSubmit() {
    setError(null);
    const input: TemplateInput = {
      title,
      description,
      slug,
      scoringMode,
      scaleMin,
      scaleMax,
      sections,
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
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
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

      <div className="grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
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
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scale_max">Skala bis</Label>
          <Input
            id="scale_max"
            type="number"
            value={scaleMax}
            onChange={(e) => setScaleMax(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">
            Sektionen ({sections.length})
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            Sektion hinzufügen
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {sections.map((section, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Key</Label>
                <Input
                  value={section.key}
                  onChange={(e) => updateSection(index, { key: e.target.value })}
                  placeholder="z. B. komplexitaet"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Label</Label>
                <Input
                  value={section.label}
                  onChange={(e) => updateSection(index, { label: e.target.value })}
                  placeholder="z. B. Komplexität des Projekts"
                />
              </div>
              <div className="flex items-end">
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
          ))}
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
                    Sektion
                  </Label>
                  <select
                    value={question.sectionKey}
                    onChange={(e) =>
                      updateQuestion(index, { sectionKey: e.target.value })
                    }
                    className={selectClassName}
                  >
                    <option value="">–</option>
                    {sections.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label || s.key}
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
