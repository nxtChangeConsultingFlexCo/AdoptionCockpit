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
  organization_id: string | null;
  based_on_template_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AssessmentTemplateSummary = Pick<
  AssessmentTemplateRow,
  "id" | "title" | "description" | "slug"
>;

export type AssessmentScopeType = "org" | "roles" | "users";

export interface OrganizationAssessmentRow {
  id: string;
  organization_id: string;
  template_id: string;
  is_available: boolean;
  sort_order: number;
  scope_type: AssessmentScopeType;
  role_list: string[];
  user_ids: string[];
  created_at: string;
  updated_at: string;
}
