import type { AssessmentQuestion } from "@/data/questions";

export interface AssessmentTemplateRow {
  id: string;
  title: string;
  description: string;
  slug: string;
  questions: AssessmentQuestion[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AssessmentTemplateSummary = Pick<
  AssessmentTemplateRow,
  "id" | "title" | "description" | "slug"
>;
