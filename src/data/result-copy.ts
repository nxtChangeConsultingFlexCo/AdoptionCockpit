// Empfehlungstexte kommen jetzt god-editierbar aus
// assessment_templates.recommendations (siehe types/template.ts) statt
// hier hartcodiert zu sein. Diese Datei enthält nur noch die
// Tier-Einteilung (Score -> low/medium/high), die sowohl für die
// Anzeige-Badge als auch zur Auswahl des passenden Empfehlungstexts
// verwendet wird.
export const SCORE_TIERS = ["low", "medium", "high"] as const;

export type ScoreTier = (typeof SCORE_TIERS)[number];

// lowMax/mediumMax kommen optional aus assessment_templates.tier_low_max /
// .tier_medium_max (Migration 0040) - nur wirksam, wenn beide gesetzt
// sind, sonst gelten die bisherigen festen Grenzen 40/70.
export function getScoreTier(
  score: number,
  lowMax?: number | null,
  mediumMax?: number | null,
): ScoreTier {
  const low = typeof lowMax === "number" ? lowMax : 40;
  const medium = typeof mediumMax === "number" ? mediumMax : 70;
  if (score < low) return "low";
  if (score < medium) return "medium";
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

// highThreshold kommt optional aus
// assessment_templates.section_sum_high_threshold (Migration 0040) - wenn
// gesetzt, gilt sum >= highThreshold als "high"; sonst bisheriger Split
// am Mittelpunkt von [min, max].
export function getSectionSumTier(
  sum: number,
  min: number,
  max: number,
  highThreshold?: number | null,
): SectionSumTier {
  if (typeof highThreshold === "number") {
    return sum >= highThreshold ? "high" : "low";
  }
  const midpoint = (min + max) / 2;
  return sum <= midpoint ? "low" : "high";
}

export const SECTION_SUM_TIER_LABELS: Record<SectionSumTier, string> = {
  low: "Geringer Change-Management-Bedarf",
  high: "Hoher Change-Management-Bedarf",
};
