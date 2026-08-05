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
