"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SCALE_LABELS, type AssessmentQuestion } from "@/data/questions";
import type { TemplateSection } from "@/types/assessment";

interface TemplatePreviewProps {
  title: string;
  description: string;
  sections: TemplateSection[];
  questions: AssessmentQuestion[];
  scaleMin: number;
  scaleMax: number;
}

// Rein lesende Vorschau des Fragebogens, wie ihn Nutzende später sehen
// würden - an das Markup von assessment-flow.tsx angelehnt, aber ohne
// Interaktion/Submit-Logik. Hilft Autor:innen im Template-Builder, ihre
// Änderungen zu prüfen, bevor sie gespeichert werden.
export function TemplatePreview({
  title,
  description,
  sections,
  questions,
  scaleMin,
  scaleMax,
}: TemplatePreviewProps) {
  const scaleValues =
    scaleMax >= scaleMin
      ? Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i)
      : [];

  const orphanQuestions = questions.filter(
    (q) => !sections.some((s) => s.key === q.sectionKey),
  );

  return (
    <div className="flex flex-col gap-10 rounded-xl border border-dashed border-border p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title || "Unbenanntes Template"}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Noch keine Sektionen zum Anzeigen.
        </p>
      )}

      {sections.map((section, sectionIndex) => {
        const sectionQuestions = questions.filter(
          (q) => q.sectionKey === section.key,
        );
        if (sectionQuestions.length === 0) return null;
        const showGroupHeading =
          section.group && section.group !== sections[sectionIndex - 1]?.group;

        return (
          <section key={section.key || sectionIndex} className="flex flex-col gap-6">
            {showGroupHeading && (
              <h3 className="-mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {section.group}
              </h3>
            )}
            <h2 className="text-lg font-medium text-foreground">
              {section.label || "Unbenannte Sektion"}
            </h2>
            {sectionQuestions.map((question, questionIndex) => (
              <div
                key={question.id || `${section.key}-${questionIndex}`}
                className="flex flex-col gap-3"
              >
                <p className="text-sm text-foreground">
                  {question.text || "(kein Fragetext)"}
                </p>
                {scaleValues.length > 0 && (
                  <RadioGroup
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${scaleValues.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {scaleValues.map((value) => {
                      const label =
                        value === scaleMin
                          ? (question.lowLabel ?? SCALE_LABELS[value])
                          : value === scaleMax
                            ? (question.highLabel ?? SCALE_LABELS[value])
                            : undefined;
                      return (
                        <label
                          key={value}
                          className="flex flex-col items-center gap-1.5 text-center"
                        >
                          <RadioGroupItem value={value.toString()} disabled />
                          <span className="hidden text-[11px] leading-tight text-muted-foreground sm:block">
                            {label ?? value}
                          </span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>
            ))}
          </section>
        );
      })}

      {orphanQuestions.length > 0 && (
        <p className="text-sm text-destructive">
          {orphanQuestions.length} Frage(n) referenzieren keine vorhandene
          Sektion und werden hier nicht angezeigt.
        </p>
      )}
    </div>
  );
}
