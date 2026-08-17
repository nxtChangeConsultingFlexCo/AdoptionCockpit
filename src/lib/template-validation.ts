import type { AssessmentQuestion } from "@/data/questions";
import type { TemplateSection } from "@/types/assessment";
import type { ResultVisualization, ScoringMode, TemplateRecommendations } from "@/types/template";

// Von Client (inline Feld-Fehler im Template-Builder) und Server Action
// (`src/app/settings/templates/actions.ts`, letzte Verteidigungslinie)
// gemeinsam genutzt, damit beide Seiten exakt dieselben Regeln anwenden.
export interface TemplateInput {
  title: string;
  description: string;
  slug: string;
  scoringMode: ScoringMode;
  scaleMin: number;
  scaleMax: number;
  resultVisualization: ResultVisualization;
  tierLowMax: number | null;
  tierMediumMax: number | null;
  sectionSumHighThreshold: number | null;
  sections: TemplateSection[];
  questions: AssessmentQuestion[];
  isActive: boolean;
  sortOrder: number;
  recommendations: TemplateRecommendations;
}

export interface TemplateValidationError {
  // Feldpfad zur Zuordnung im Formular, z. B. "title", "sections[2].key",
  // "questions[5].sectionKey". Nicht an ein bestimmtes UI-Element gebunden.
  field: string;
  message: string;
}

export function validateTemplateInput(input: TemplateInput): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];

  if (!input.title.trim()) {
    errors.push({ field: "title", message: "Titel darf nicht leer sein." });
  }
  if (!input.slug.trim() || !/^[a-z0-9-]+$/.test(input.slug)) {
    errors.push({
      field: "slug",
      message: "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.",
    });
  }

  if (!Number.isFinite(input.scaleMin) || !Number.isFinite(input.scaleMax)) {
    errors.push({ field: "scale", message: "Skala von/bis muss eine Zahl sein." });
  } else if (input.scaleMin >= input.scaleMax) {
    errors.push({ field: "scale", message: "Skala von muss kleiner als Skala bis sein." });
  }

  if (
    input.scoringMode === "dimension_average" &&
    input.tierLowMax != null &&
    input.tierMediumMax != null &&
    input.tierLowMax >= input.tierMediumMax
  ) {
    errors.push({
      field: "tierThresholds",
      message: "Tier-Grenze niedrig muss kleiner als Tier-Grenze mittel sein.",
    });
  }

  if (input.sections.length === 0) {
    errors.push({ field: "sections", message: "Mindestens eine Sektion ist erforderlich." });
  }
  input.sections.forEach((section, index) => {
    if (!section.key.trim() || !section.label.trim()) {
      errors.push({
        field: `sections[${index}]`,
        message: "Alle Sektionen benötigen einen Key und ein Label.",
      });
    }
  });
  const sectionKeys = input.sections.map((s) => s.key);
  if (new Set(sectionKeys).size !== sectionKeys.length) {
    errors.push({
      field: "sections",
      message: "Sektions-Keys müssen innerhalb des Templates eindeutig sein.",
    });
  }

  if (input.questions.length === 0) {
    errors.push({ field: "questions", message: "Mindestens eine Frage ist erforderlich." });
  }
  input.questions.forEach((question, index) => {
    if (!question.id.trim() || !question.text.trim()) {
      errors.push({
        field: `questions[${index}]`,
        message: "Alle Fragen benötigen eine ID und einen Text.",
      });
    } else if (!sectionKeys.includes(question.sectionKey)) {
      errors.push({
        field: `questions[${index}].sectionKey`,
        message: `Frage "${question.id}" referenziert keine vorhandene Sektion.`,
      });
    }
  });
  const ids = input.questions.map((q) => q.id);
  if (new Set(ids).size !== ids.length) {
    errors.push({
      field: "questions",
      message: "Frage-IDs müssen innerhalb des Templates eindeutig sein.",
    });
  }

  return errors;
}
