import type { AssessmentDimension } from "@/types/assessment";

export const READINESS_TIERS = ["starting", "developing", "established", "leading"] as const;

export type ReadinessTier = (typeof READINESS_TIERS)[number];

export function getReadinessTier(score: number): ReadinessTier {
  if (score < 40) return "starting";
  if (score < 60) return "developing";
  if (score < 80) return "established";
  return "leading";
}

export const TIER_LABELS: Record<ReadinessTier, string> = {
  starting: "Einstiegsphase",
  developing: "Aufbauphase",
  established: "Solide Basis",
  leading: "Vorreiterposition",
};

export const TIER_SUMMARIES: Record<ReadinessTier, string> = {
  starting:
    "Ihr steht am Anfang eurer KI-Readiness-Reise. Die gute Nachricht: Die größten Hebel sind identifizierbar – mit gezielten ersten Schritten schafft ihr schnell eine solide Basis.",
  developing:
    "Ihr habt bereits Grundlagen geschaffen. Jetzt geht es darum, einzelne Bausteine zu verfestigen und Verantwortlichkeiten zu schärfen.",
  established:
    "Euer Unternehmen verfügt über eine solide Basis für den KI-Einsatz. Mit gezielten nächsten Schritten könnt ihr das Tempo weiter erhöhen.",
  leading:
    "Euer Unternehmen zählt zu den Vorreitern in Sachen KI-Readiness. Jetzt zählt es, das Momentum zu halten und die Wirkung zu skalieren.",
};

export const DIMENSION_ASSESSMENTS: Record<
  AssessmentDimension,
  Record<ReadinessTier, string>
> = {
  datenqualitaet: {
    starting:
      "Eure Datenbasis ist aktuell verstreut und schwer greifbar – hier liegt der wichtigste Hebel, bevor KI-Projekte skalieren können.",
    developing:
      "Erste Strukturen sind erkennbar, doch Vollständigkeit und Aktualität eurer Daten schwanken noch spürbar.",
    established:
      "Eure Daten sind überwiegend zentral verfügbar und gepflegt – eine solide Basis für den produktiven KI-Einsatz.",
    leading:
      "Datenqualität und -verfügbarkeit gehören zu euren Stärken – ein klarer Vorteil für skalierte KI-Anwendungen.",
  },
  prozessklarheit: {
    starting:
      "Prozesse und Zuständigkeiten sind bislang kaum dokumentiert – ohne Klarheit hier bleibt KI-Automatisierung Stückwerk.",
    developing:
      "Kernprozesse sind teilweise beschrieben, Schnittstellen und Verantwortlichkeiten aber noch nicht durchgängig klar.",
    established:
      "Eure Prozesse sind gut dokumentiert und nachvollziehbar – ein gutes Fundament, um gezielt zu automatisieren.",
    leading:
      "Klare, dokumentierte Prozesse machen es euch leicht, KI gezielt an den richtigen Stellen einzusetzen.",
  },
  kulturelle_akzeptanz: {
    starting:
      "Neue Technologien stoßen aktuell eher auf Zurückhaltung – Change-Begleitung wird ein zentraler Erfolgsfaktor sein.",
    developing:
      "Die Offenheit wächst, hängt aber noch stark von einzelnen Personen und Teams ab.",
    established:
      "Mitarbeitende und Führung stehen KI-Themen überwiegend aufgeschlossen gegenüber – ein guter Nährboden für Veränderung.",
    leading:
      "Eine ausgeprägte Lern- und Experimentierkultur macht euch bereit, KI schnell und breit zu adaptieren.",
  },
  governance_compliance: {
    starting:
      "Rechtliche Leitplanken und Verantwortlichkeiten für KI-Einsatz fehlen noch weitgehend – hier besteht akuter Klärungsbedarf.",
    developing:
      "Erste Überlegungen zu Richtlinien und Verantwortlichkeiten existieren, sind aber noch nicht verbindlich verankert.",
    established:
      "Ihr habt ein grundlegendes Verständnis der relevanten Vorgaben und beginnt, Verantwortlichkeiten festzulegen.",
    leading:
      "Governance-Strukturen und Verantwortlichkeiten für KI sind klar geregelt – ihr agiert compliant und risikobewusst.",
  },
};
