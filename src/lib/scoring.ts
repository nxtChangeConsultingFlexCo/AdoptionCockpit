import type { AssessmentQuestion } from "@/data/questions";
import {
  ASSESSMENT_DIMENSIONS,
  type AssessmentScores,
} from "@/types/assessment";

export function isAnswersComplete(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): boolean {
  return questions.every((q) => typeof answers[q.id] === "number");
}

export function computeScores(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): {
  scores: AssessmentScores;
  totalScore: number;
} {
  const scores = {} as AssessmentScores;

  for (const dimension of ASSESSMENT_DIMENSIONS) {
    const values = questions
      .filter((q) => q.dimension === dimension)
      .map((q) => answers[q.id])
      .filter((value): value is number => typeof value === "number");

    const average =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

    // Skala 1-5 -> Score 0-100
    scores[dimension] = Math.round(((average - 1) / 4) * 100);
  }

  const totalScore = Math.round(
    ASSESSMENT_DIMENSIONS.reduce((sum, dimension) => sum + scores[dimension], 0) /
      ASSESSMENT_DIMENSIONS.length,
  );

  return { scores, totalScore };
}
