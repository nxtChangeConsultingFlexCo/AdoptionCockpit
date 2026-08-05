"use server";

import { createClient } from "@/lib/supabase/server";
import { computeScores, isAnswersComplete } from "@/lib/scoring";
import type { AssessmentQuestion } from "@/data/questions";
import type {
  AssessmentScores,
  CompanySizeBand,
} from "@/types/assessment";

export interface SaveAssessmentResult {
  data?: { id: string; scores: AssessmentScores; totalScore: number };
  error?: string;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Fragen werden serverseitig anhand der templateId nachgeladen statt vom
// Client übernommen - sonst könnte ein manipulierter Client die
// Dimension-Zuordnung verändern und damit den Score verfälschen.
async function loadTemplateQuestions(
  supabase: SupabaseServerClient,
  templateId: string,
): Promise<AssessmentQuestion[] | null> {
  const { data } = await supabase
    .from("assessment_templates")
    .select("questions")
    .eq("id", templateId)
    .maybeSingle();

  if (!data) return null;
  return data.questions as AssessmentQuestion[];
}

export async function saveAuthenticatedAssessment(
  templateId: string,
  answers: Record<string, number>,
  companySizeBand: CompanySizeBand | null,
): Promise<SaveAssessmentResult> {
  const supabase = await createClient();
  const questions = await loadTemplateQuestions(supabase, templateId);
  if (!questions) {
    return { error: "Assessment-Vorlage nicht gefunden." };
  }
  if (!isAnswersComplete(questions, answers)) {
    return { error: "Bitte beantworte zuerst alle Fragen." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, last_name, company_name, job_title, gdpr_consent, marketing_consent",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { scores, totalScore } = computeScores(questions, answers);

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      email: user.email,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      company_name: profile?.company_name ?? null,
      job_title: profile?.job_title ?? null,
      gdpr_consent: profile?.gdpr_consent ?? false,
      marketing_consent: profile?.marketing_consent ?? false,
      template_id: templateId,
      company_size_band: companySizeBand,
      answers,
      scores,
      total_score: totalScore,
      status: "completed",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Etwas ist schiefgelaufen." };
  }

  return { data: { id: data.id, scores, totalScore } };
}

export interface GuestContact {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  gdprConsent: boolean;
  marketingConsent: boolean;
}

export async function saveGuestAssessment(
  templateId: string,
  answers: Record<string, number>,
  contact: GuestContact,
  companySizeBand: CompanySizeBand | null,
): Promise<SaveAssessmentResult> {
  const supabase = await createClient();
  const questions = await loadTemplateQuestions(supabase, templateId);
  if (!questions) {
    return { error: "Assessment-Vorlage nicht gefunden." };
  }
  if (!isAnswersComplete(questions, answers)) {
    return { error: "Bitte beantworte zuerst alle Fragen." };
  }
  if (!contact.email || !contact.firstName || !contact.lastName || !contact.companyName) {
    return { error: "Bitte fülle alle Pflichtfelder aus." };
  }
  if (!contact.gdprConsent) {
    return { error: "Bitte stimme der Datenverarbeitung zu, um das Ergebnis zu erhalten." };
  }

  const { scores, totalScore } = computeScores(questions, answers);

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      email: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName,
      company_name: contact.companyName,
      job_title: contact.jobTitle || null,
      gdpr_consent: contact.gdprConsent,
      marketing_consent: contact.marketingConsent,
      template_id: templateId,
      company_size_band: companySizeBand,
      answers,
      scores,
      total_score: totalScore,
      status: "completed",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Etwas ist schiefgelaufen." };
  }

  return { data: { id: data.id, scores, totalScore } };
}
