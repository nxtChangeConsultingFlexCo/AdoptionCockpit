// Empfehlungstexte kommen jetzt god-editierbar aus
// assessment_templates.recommendations (siehe types/template.ts) statt
// hier hartcodiert zu sein. Diese Datei enthält nur noch die
// Tier-Einteilung (Score -> low/medium/high), die sowohl für die
// Anzeige-Badge als auch zur Auswahl des passenden Empfehlungstexts
// verwendet wird.
export const SCORE_TIERS = ["low", "medium", "high"] as const;

export type ScoreTier = (typeof SCORE_TIERS)[number];

export function getScoreTier(score: number): ScoreTier {
  if (score < 40) return "low";
  if (score < 70) return "medium";
  return "high";
}

export const SCORE_TIER_LABELS: Record<ScoreTier, string> = {
  low: "Einstiegsphase",
  medium: "Solide Basis",
  high: "Vorreiterposition",
};

// Für section_sum-Templates (Summe statt 0-100-Score): nur ein binärer
// Tier, gesplittet am Mittelpunkt des möglichen Wertebereichs
// [count*scaleMin, count*scaleMax] - entspricht der Low/High-Interpretation
// der SAP-artigen Vorlage, die keine Mittelstufe kennt.
export const SECTION_SUM_TIERS = ["low", "high"] as const;

export type SectionSumTier = (typeof SECTION_SUM_TIERS)[number];

export function getSectionSumTier(sum: number, min: number, max: number): SectionSumTier {
  const midpoint = (min + max) / 2;
  return sum <= midpoint ? "low" : "high";
}

export const SECTION_SUM_TIER_LABELS: Record<SectionSumTier, string> = {
  low: "Geringer Change-Management-Bedarf",
  high: "Hoher Change-Management-Bedarf",
};
