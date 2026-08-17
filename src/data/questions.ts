export interface AssessmentQuestion {
  id: string;
  sectionKey: string;
  text: string;
  // Optionale Anker-Beschriftungen an den Skalen-Enden (z. B. "wenige" /
  // "viele" bei summenbasierten Templates). Fällt sonst auf SCALE_LABELS
  // zurück, damit die bestehenden agree/disagree-Formulierungen des
  // KI-Readiness-Checks unverändert bleiben.
  lowLabel?: string;
  highLabel?: string;
}

// Fallback-Beschriftungen für die Skalen-Enden, wenn eine Frage keine
// eigenen lowLabel/highLabel mitbringt (bisheriges Verhalten des
// KI-Readiness-Checks, Skala 1-5).
export const SCALE_LABELS: Record<number, string> = {
  1: "Stimme gar nicht zu",
  2: "Stimme eher nicht zu",
  3: "Teils/teils",
  4: "Stimme eher zu",
  5: "Stimme voll zu",
};

// Legacy-Referenz: der ursprünglich hartcodierte Fragenkatalog des
// KI-Readiness-Checks. Seit Migration 0011/0012 kommt der tatsächliche,
// live editierbare Fragenkatalog aus assessment_templates.questions in der
// DB - dieses Array wird im Code nicht mehr gelesen.
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "dq_1",
    sectionKey: "datenqualitaet",
    text: "Unsere geschäftskritischen Daten sind an einem zentralen, auffindbaren Ort gespeichert.",
  },
  {
    id: "dq_2",
    sectionKey: "datenqualitaet",
    text: "Wir wissen, welche Daten wir besitzen und wie aktuell sie sind.",
  },
  {
    id: "dq_3",
    sectionKey: "datenqualitaet",
    text: "Unsere Daten sind weitgehend vollständig und frei von Duplikaten.",
  },
  {
    id: "dq_4",
    sectionKey: "datenqualitaet",
    text: "Es gibt klare Verantwortlichkeiten für unsere wichtigsten Datenquellen.",
  },
  {
    id: "pk_1",
    sectionKey: "prozessklarheit",
    text: "Unsere Kernprozesse sind dokumentiert und für Mitarbeitende nachvollziehbar.",
  },
  {
    id: "pk_2",
    sectionKey: "prozessklarheit",
    text: "Wir wissen, an welchen Stellen im Prozess wiederkehrende, regelbasierte Aufgaben anfallen.",
  },
  {
    id: "pk_3",
    sectionKey: "prozessklarheit",
    text: "Verantwortlichkeiten und Schnittstellen zwischen Abteilungen sind klar definiert.",
  },
  {
    id: "ka_1",
    sectionKey: "kulturelle_akzeptanz",
    text: "Mitarbeitende stehen neuen Technologien grundsätzlich offen gegenüber.",
  },
  {
    id: "ka_2",
    sectionKey: "kulturelle_akzeptanz",
    text: "Führungskräfte unterstützen aktiv die Einführung von KI-Lösungen.",
  },
  {
    id: "ka_3",
    sectionKey: "kulturelle_akzeptanz",
    text: "Es gibt Raum und Zeit, um neue Tools auszuprobieren und zu lernen.",
  },
  {
    id: "ka_4",
    sectionKey: "kulturelle_akzeptanz",
    text: "Fehler im Umgang mit neuen Technologien werden als Lernchance gesehen.",
  },
  {
    id: "gc_1",
    sectionKey: "governance_compliance",
    text: "Uns ist klar, welche rechtlichen Vorgaben (z. B. DSGVO, EU AI Act) für unseren KI-Einsatz gelten.",
  },
  {
    id: "gc_2",
    sectionKey: "governance_compliance",
    text: "Es gibt – oder es ist geplant – eine interne Richtlinie zum Umgang mit KI-Tools.",
  },
  {
    id: "gc_3",
    sectionKey: "governance_compliance",
    text: "Verantwortlichkeiten für Risikobewertung und Freigabe von KI-Anwendungen sind geklärt.",
  },
];
