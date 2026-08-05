"use server";

import { createClient } from "@/lib/supabase/server";
import { computeScores, isAnswersComplete } from "@/lib/scoring";
import type { AssessmentScores } from "@/types/assessment";

export interface SaveAssessmentResult {
  data?: { id: string; scores: AssessmentScores; totalScore: number };
  error?: string;
}

export async function saveAuthenticatedAssessment(
  answers: Record<string, number>,
): Promise<SaveAssessmentResult> {
  if (!isAnswersComplete(answers)) {
    return { error: "Bitte beantworte zuerst alle Fragen." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nicht angemeldet." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, company_name, role, gdpr_consent, marketing_consent")
    .eq("id", user.id)
    .maybeSingle();

  const { scores, totalScore } = computeScores(answers);

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      email: user.email,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      company_name: profile?.company_name ?? null,
      role: profile?.role ?? null,
      gdpr_consent: profile?.gdpr_consent ?? false,
      marketing_consent: profile?.marketing_consent ?? false,
      answers,
      scores,
      total_score: totalScore,
      status: "completed",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: { id: data.id, scores, totalScore } };
}

export interface GuestContact {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: string;
  gdprConsent: boolean;
  marketingConsent: boolean;
}

export async function saveGuestAssessment(
  answers: Record<string, number>,
  contact: GuestContact,
): Promise<SaveAssessmentResult> {
  if (!isAnswersComplete(answers)) {
    return { error: "Bitte beantworte zuerst alle Fragen." };
  }
  if (!contact.email || !contact.firstName || !contact.lastName || !contact.companyName) {
    return { error: "Bitte fülle alle Pflichtfelder aus." };
  }
  if (!contact.gdprConsent) {
    return { error: "Bitte stimme der Datenverarbeitung zu, um das Ergebnis zu erhalten." };
  }

  const supabase = await createClient();
  const { scores, totalScore } = computeScores(answers);

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      email: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName,
      company_name: contact.companyName,
      role: contact.role || null,
      gdpr_consent: contact.gdprConsent,
      marketing_consent: contact.marketingConsent,
      answers,
      scores,
      total_score: totalScore,
      status: "completed",
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: { id: data.id, scores, totalScore } };
}
