import type { AssessmentDimension } from "@/types/assessment";

export interface AssessmentQuestion {
  id: string;
  dimension: AssessmentDimension;
  text: string;
}

export const SCALE_LABELS: Record<number, string> = {
  1: "Stimme gar nicht zu",
  2: "Stimme eher nicht zu",
  3: "Teils/teils",
  4: "Stimme eher zu",
  5: "Stimme voll zu",
};

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "dq_1",
    dimension: "datenqualitaet",
    text: "Unsere geschäftskritischen Daten sind an einem zentralen, auffindbaren Ort gespeichert.",
  },
  {
    id: "dq_2",
    dimension: "datenqualitaet",
    text: "Wir wissen, welche Daten wir besitzen und wie aktuell sie sind.",
  },
  {
    id: "dq_3",
    dimension: "datenqualitaet",
    text: "Unsere Daten sind weitgehend vollständig und frei von Duplikaten.",
  },
  {
    id: "dq_4",
    dimension: "datenqualitaet",
    text: "Es gibt klare Verantwortlichkeiten für unsere wichtigsten Datenquellen.",
  },
  {
    id: "pk_1",
    dimension: "prozessklarheit",
    text: "Unsere Kernprozesse sind dokumentiert und für Mitarbeitende nachvollziehbar.",
  },
  {
    id: "pk_2",
    dimension: "prozessklarheit",
    text: "Wir wissen, an welchen Stellen im Prozess wiederkehrende, regelbasierte Aufgaben anfallen.",
  },
  {
    id: "pk_3",
    dimension: "prozessklarheit",
    text: "Verantwortlichkeiten und Schnittstellen zwischen Abteilungen sind klar definiert.",
  },
  {
    id: "ka_1",
    dimension: "kulturelle_akzeptanz",
    text: "Mitarbeitende stehen neuen Technologien grundsätzlich offen gegenüber.",
  },
  {
    id: "ka_2",
    dimension: "kulturelle_akzeptanz",
    text: "Führungskräfte unterstützen aktiv die Einführung von KI-Lösungen.",
  },
  {
    id: "ka_3",
    dimension: "kulturelle_akzeptanz",
    text: "Es gibt Raum und Zeit, um neue Tools auszuprobieren und zu lernen.",
  },
  {
    id: "ka_4",
    dimension: "kulturelle_akzeptanz",
    text: "Fehler im Umgang mit neuen Technologien werden als Lernchance gesehen.",
  },
  {
    id: "gc_1",
    dimension: "governance_compliance",
    text: "Uns ist klar, welche rechtlichen Vorgaben (z. B. DSGVO, EU AI Act) für unseren KI-Einsatz gelten.",
  },
  {
    id: "gc_2",
    dimension: "governance_compliance",
    text: "Es gibt – oder es ist geplant – eine interne Richtlinie zum Umgang mit KI-Tools.",
  },
  {
    id: "gc_3",
    dimension: "governance_compliance",
    text: "Verantwortlichkeiten für Risikobewertung und Freigabe von KI-Anwendungen sind geklärt.",
  },
];
