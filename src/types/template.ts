import type { AssessmentQuestion } from "@/data/questions";
import type { AssessmentDimension } from "./assessment";

export interface RecommendationTiers {
  low: string;
  medium: string;
  high: string;
}

export interface TemplateRecommendations {
  byDimension: Partial<Record<AssessmentDimension, Partial<RecommendationTiers>>>;
  overall: Partial<RecommendationTiers>;
}

export interface AssessmentTemplateRow {
  id: string;
  title: string;
  description: string;
  slug: string;
  questions: AssessmentQuestion[];
  recommendations: TemplateRecommendations;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type AssessmentTemplateSummary = Pick<
  AssessmentTemplateRow,
  "id" | "title" | "description" | "slug"
>;
