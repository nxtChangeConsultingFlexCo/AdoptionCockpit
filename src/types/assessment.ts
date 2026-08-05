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
  role: string | null;
  gdpr_consent: boolean;
  marketing_consent: boolean;
}

export interface ProfileRow {
  id: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  role: string | null;
  gdpr_consent: boolean;
  marketing_consent: boolean;
}
