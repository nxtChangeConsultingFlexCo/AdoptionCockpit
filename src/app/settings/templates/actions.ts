"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentQuestion } from "@/data/questions";
import type { TemplateSection } from "@/types/assessment";
import type {
  ResultVisualization,
  ScoringMode,
  TemplateRecommendations,
} from "@/types/template";

export interface TemplateActionResult {
  error?: string;
  id?: string;
}

export interface TemplateInput {
  title: string;
  description: string;
  slug: string;
  scoringMode: ScoringMode;
  scaleMin: number;
  scaleMax: number;
  resultVisualization: ResultVisualization;
  sections: TemplateSection[];
  questions: AssessmentQuestion[];
  isActive: boolean;
  sortOrder: number;
  recommendations: TemplateRecommendations;
}

function validateTemplate(input: TemplateInput): string | null {
  if (!input.title.trim()) return "Titel darf nicht leer sein.";
  if (!input.slug.trim() || !/^[a-z0-9-]+$/.test(input.slug)) {
    return "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.";
  }
  if (!Number.isFinite(input.scaleMin) || !Number.isFinite(input.scaleMax)) {
    return "Skala von/bis muss eine Zahl sein.";
  }
  if (input.scaleMin >= input.scaleMax) {
    return "Skala von muss kleiner als Skala bis sein.";
  }
  if (input.sections.length === 0) {
    return "Mindestens eine Sektion ist erforderlich.";
  }
  for (const section of input.sections) {
    if (!section.key.trim() || !section.label.trim()) {
      return "Alle Sektionen benötigen einen Key und ein Label.";
    }
  }
  const sectionKeys = input.sections.map((s) => s.key);
  if (new Set(sectionKeys).size !== sectionKeys.length) {
    return "Sektions-Keys müssen innerhalb des Templates eindeutig sein.";
  }
  if (input.questions.length === 0) {
    return "Mindestens eine Frage ist erforderlich.";
  }
  for (const question of input.questions) {
    if (!question.id.trim() || !question.text.trim()) {
      return "Alle Fragen benötigen eine ID und einen Text.";
    }
    if (!sectionKeys.includes(question.sectionKey)) {
      return `Frage "${question.id}" referenziert keine vorhandene Sektion.`;
    }
  }
  const ids = input.questions.map((q) => q.id);
  if (new Set(ids).size !== ids.length) {
    return "Frage-IDs müssen innerhalb des Templates eindeutig sein.";
  }
  return null;
}

export async function createTemplate(
  input: TemplateInput,
): Promise<TemplateActionResult> {
  const validationError = validateTemplate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_templates")
    .insert({
      title: input.title,
      description: input.description,
      slug: input.slug,
      scoring_mode: input.scoringMode,
      scale_min: input.scaleMin,
      scale_max: input.scaleMax,
      result_visualization: input.resultVisualization,
      sections: input.sections,
      questions: input.questions,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      recommendations: input.recommendations,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Etwas ist schiefgelaufen." };
  }

  revalidatePath("/settings/templates");
  revalidatePath("/");
  return { id: data.id };
}

export async function updateTemplate(
  id: string,
  input: TemplateInput,
): Promise<TemplateActionResult> {
  const validationError = validateTemplate(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error, data } = await supabase
    .from("assessment_templates")
    .update({
      title: input.title,
      description: input.description,
      slug: input.slug,
      scoring_mode: input.scoringMode,
      scale_min: input.scaleMin,
      scale_max: input.scaleMax,
      result_visualization: input.resultVisualization,
      sections: input.sections,
      questions: input.questions,
      is_active: input.isActive,
      sort_order: input.sortOrder,
      recommendations: input.recommendations,
    })
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung, dieses Template zu ändern." };
  }

  revalidatePath("/settings/templates");
  revalidatePath(`/settings/templates/${id}`);
  revalidatePath("/");
  return { id };
}

export async function toggleTemplateActive(
  id: string,
  isActive: boolean,
): Promise<TemplateActionResult> {
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("assessment_templates")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Keine Berechtigung, dieses Template zu ändern." };
  }

  revalidatePath("/settings/templates");
  revalidatePath("/");
  return { id };
}
