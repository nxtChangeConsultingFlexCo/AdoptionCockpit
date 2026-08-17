"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateTemplateInput, type TemplateInput } from "@/lib/template-validation";

export type { TemplateInput };

export interface TemplateActionResult {
  error?: string;
  id?: string;
}

function validateTemplate(input: TemplateInput): string | null {
  return validateTemplateInput(input)[0]?.message ?? null;
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
      tier_low_max: input.tierLowMax,
      tier_medium_max: input.tierMediumMax,
      section_sum_high_threshold: input.sectionSumHighThreshold,
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
      tier_low_max: input.tierLowMax,
      tier_medium_max: input.tierMediumMax,
      section_sum_high_threshold: input.sectionSumHighThreshold,
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
