import type { AppRole } from "./roles";

// Sektionen sind seit der Generalisierung (Migration 0037) Teil des
// jeweiligen Templates (assessment_templates.sections) statt einer
// globalen, festen Konstante - so können Templates mit abweichender
// Sektionsanzahl/-benennung (z. B. ein summenbasierter Check statt des
// KI-Readiness-Checks) dieselbe Infrastruktur nutzen.
export interface TemplateSection {
  key: string;
  label: string;
  // Optionale übergeordnete Gruppierung (z. B. "Allgemeine" vs.
  // "Operative Fähigkeiten") - rein fürs Rendering, hat keinen Einfluss
  // auf Scoring. Sektionen ohne group werden weiterhin als flache Liste
  // dargestellt.
  group?: string;
}

export type AssessmentStatus = "draft" | "completed";

export type AssessmentScores = Record<string, number>;

export const COMPANY_SIZE_BANDS = ["1-19", "20-49", "50-249", "250+"] as const;

export type CompanySizeBand = (typeof COMPANY_SIZE_BANDS)[number];

export const COMPANY_SIZE_BAND_LABELS: Record<CompanySizeBand, string> = {
  "1-19": "1–19 Mitarbeitende",
  "20-49": "20–49 Mitarbeitende",
  "50-249": "50–249 Mitarbeitende",
  "250+": "250+ Mitarbeitende",
};

export interface AssessmentRow {
  id: string;
  created_at: string;
  company_name: string | null;
  email: string | null;
  answers: Record<string, unknown>;
  scores: AssessmentScores | null;
  total_score: number | null;
  status: AssessmentStatus;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  gdpr_consent: boolean;
  marketing_consent: boolean;
  template_id: string | null;
  company_size_band: CompanySizeBand | null;
}

export interface TemplateBenchmark {
  sampleSize: number;
  medianTotalScore: number;
  medianBySection: AssessmentScores;
}

export interface ProfileRow {
  id: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  role: AppRole;
  organization_id: string | null;
  gdpr_consent: boolean;
  marketing_consent: boolean;
  is_blocked: boolean;
  blocked_at: string | null;
  blocked_reason: string | null;
}
