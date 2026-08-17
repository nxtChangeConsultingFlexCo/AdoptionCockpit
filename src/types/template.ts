import type { AssessmentQuestion } from "@/data/questions";
import type { TemplateSection } from "./assessment";

// dimension_average = Mittelwert je Sektion, auf 0-100 skaliert (bisheriges
// KI-Readiness-Verhalten, 3 Tiers low/medium/high).
// section_sum = Summe der Antworten je Sektion, keine Normalisierung,
// Interpretation über den Wertebereich [Fragenanzahl*scale_min, ..*scale_max]
// (2 Tiers low/high, Split am Mittelpunkt des Bereichs).
export type ScoringMode = "dimension_average" | "section_sum";

// bars = SectionScaleCard-Balken je Sektion (Standard, siehe Migration 0037).
// radar = zusätzliches Spinnennetz-Diagramm als Ergebnis-Hero (Migration
// 0038) - nur relevant bei scoring_mode = section_sum, sinnvoll ab ~3
// Sektionen (z. B. ein persönliches Skill-Profil über mehrere Achsen).
export type ResultVisualization = "bars" | "radar";

// Tier-Keys hängen vom scoring_mode ab (siehe SCORE_TIERS / SECTION_SUM_TIERS
// in @/data/result-copy) - deshalb hier bewusst generisch statt eines
// festen low/medium/high-Interfaces.
export interface TemplateRecommendations {
  bySection: Record<string, Partial<Record<string, string>>>;
  overall: Partial<Record<string, string>>;
}

export interface AssessmentTemplateRow {
  id: string;
  title: string;
  description: string;
  slug: string;
  scoring_mode: ScoringMode;
  scale_min: number;
  scale_max: number;
  result_visualization: ResultVisualization;
  sections: TemplateSection[];
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
