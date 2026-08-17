import type { AssessmentQuestion } from "@/data/questions";
import type { AssessmentScores } from "@/types/assessment";
import type { AssessmentTemplateRow } from "@/types/template";

export function isAnswersComplete(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): boolean {
  return questions.every((q) => typeof answers[q.id] === "number");
}

export type ScoringTemplate = Pick<
  AssessmentTemplateRow,
  "sections" | "scoring_mode" | "scale_min" | "scale_max"
>;

export function computeScores(
  template: ScoringTemplate,
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): {
  scores: AssessmentScores;
  totalScore: number;
} {
  const scores: AssessmentScores = {};
  const scaleRange = template.scale_max - template.scale_min;

  for (const section of template.sections) {
    const values = questions
      .filter((q) => q.sectionKey === section.key)
      .map((q) => answers[q.id])
      .filter((value): value is number => typeof value === "number");

    if (template.scoring_mode === "section_sum") {
      // Summe je Sektion, keine Normalisierung - die Interpretation
      // erfolgt über den Wertebereich [Fragenanzahl*scale_min, ..*scale_max].
      scores[section.key] = values.reduce((sum, value) => sum + value, 0);
      continue;
    }

    const average =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

    // Skala scale_min-scale_max -> Score 0-100.
    scores[section.key] =
      scaleRange > 0
        ? Math.round(((average - template.scale_min) / scaleRange) * 100)
        : 0;
  }

  const totalScore =
    template.scoring_mode === "section_sum"
      ? Object.values(scores).reduce((sum, value) => sum + value, 0)
      : Math.round(
          template.sections.reduce((sum, section) => sum + (scores[section.key] ?? 0), 0) /
            (template.sections.length || 1),
        );

  return { scores, totalScore };
}
