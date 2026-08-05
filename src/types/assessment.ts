import type { AppRole } from "./roles";

export const ASSESSMENT_DIMENSIONS = [
  "datenqualitaet",
  "prozessklarheit",
  "kulturelle_akzeptanz",
  "governance_compliance",
] as const;

export type AssessmentDimension = (typeof ASSESSMENT_DIMENSIONS)[number];

export const ASSESSMENT_DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  datenqualitaet: "Datenqualität",
  prozessklarheit: "Prozessklarheit",
  kulturelle_akzeptanz: "Kulturelle Akzeptanz",
  governance_compliance: "Governance & Compliance",
};

export type AssessmentStatus = "draft" | "completed";

export type AssessmentScores = Record<AssessmentDimension, number>;

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
  medianByDimension: AssessmentScores;
}

export interface ProfileRow {
  id: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  job_title: string | null;
  email: string | null;
  role: AppRole;
  organization_id: string | null;
  gdpr_consent: boolean;
  marketing_consent: boolean;
}
