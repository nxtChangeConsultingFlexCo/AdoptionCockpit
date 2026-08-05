"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentQuestion } from "@/data/questions";
import type { TemplateRecommendations } from "@/types/template";

export interface TemplateActionResult {
  error?: string;
  id?: string;
}

export interface TemplateInput {
  title: string;
  description: string;
  slug: string;
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
  if (input.questions.length === 0) {
    return "Mindestens eine Frage ist erforderlich.";
  }
  for (const question of input.questions) {
    if (!question.id.trim() || !question.text.trim()) {
      return "Alle Fragen benötigen eine ID und einen Text.";
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
