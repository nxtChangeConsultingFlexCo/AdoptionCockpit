export interface RoadmapPhase {
  id: string;
  title: string;
  timeframe: string;
  description: string;
  focus: string[];
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "quick-wins",
    title: "Quick Wins",
    timeframe: "0–3 Monate",
    description:
      "Sofort umsetzbare Maßnahmen mit hohem Wirkungsgrad und geringem Aufwand – schaffen frühe Erfolge und Akzeptanz im Team.",
    focus: [
      "Erste KI-Anwendungsfälle identifizieren",
      "Bestehende Tools sinnvoll nutzen",
      "Sichtbare Ergebnisse schaffen",
    ],
  },
  {
    id: "fundament",
    title: "Fundament stärken",
    timeframe: "3–6 Monate",
    description:
      "Daten, Prozesse und Governance auf ein Niveau bringen, das nachhaltige Skalierung ermöglicht.",
    focus: [
      "Datenqualität systematisch verbessern",
      "Prozesse dokumentieren und klären",
      "Verantwortlichkeiten und Leitplanken festlegen",
    ],
  },
  {
    id: "skalieren",
    title: "Skalieren",
    timeframe: "6–12 Monate",
    description:
      "Erfolgreiche Piloten in die Breite tragen und in bestehende Abläufe integrieren.",
    focus: [
      "Erfolgreiche Use Cases ausrollen",
      "Schnittstellen und Automatisierung ausbauen",
      "Change-Begleitung für weitere Teams",
    ],
  },
  {
    id: "optimieren",
    title: "Kontinuierlich optimieren",
    timeframe: "laufend",
    description:
      "Wirkung messen, Kompetenzen im Unternehmen aufbauen und die Roadmap regelmäßig nachschärfen.",
    focus: [
      "KPIs und Wirkung messen",
      "Kompetenzen intern aufbauen",
      "Roadmap regelmäßig aktualisieren",
    ],
  },
];
