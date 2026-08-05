-- Migriert den bisher hartcodierten Fragenkatalog (src/data/questions.ts)
-- als erstes, aktives Template - sonst gäbe es nach diesem Feature keine
-- einzige Karte auf der Startseite.
insert into public.assessment_templates (title, description, slug, questions, is_active, sort_order)
values (
  'KI-Readiness-Assessment',
  'Finde in wenigen Minuten heraus, wie bereit dein Unternehmen für den Einsatz von Künstlicher Intelligenz ist.',
  'ki-readiness',
  jsonb_build_array(
    jsonb_build_object('id', 'dq_1', 'dimension', 'datenqualitaet', 'text', 'Unsere geschäftskritischen Daten sind an einem zentralen, auffindbaren Ort gespeichert.'),
    jsonb_build_object('id', 'dq_2', 'dimension', 'datenqualitaet', 'text', 'Wir wissen, welche Daten wir besitzen und wie aktuell sie sind.'),
    jsonb_build_object('id', 'dq_3', 'dimension', 'datenqualitaet', 'text', 'Unsere Daten sind weitgehend vollständig und frei von Duplikaten.'),
    jsonb_build_object('id', 'dq_4', 'dimension', 'datenqualitaet', 'text', 'Es gibt klare Verantwortlichkeiten für unsere wichtigsten Datenquellen.'),
    jsonb_build_object('id', 'pk_1', 'dimension', 'prozessklarheit', 'text', 'Unsere Kernprozesse sind dokumentiert und für Mitarbeitende nachvollziehbar.'),
    jsonb_build_object('id', 'pk_2', 'dimension', 'prozessklarheit', 'text', 'Wir wissen, an welchen Stellen im Prozess wiederkehrende, regelbasierte Aufgaben anfallen.'),
    jsonb_build_object('id', 'pk_3', 'dimension', 'prozessklarheit', 'text', 'Verantwortlichkeiten und Schnittstellen zwischen Abteilungen sind klar definiert.'),
    jsonb_build_object('id', 'ka_1', 'dimension', 'kulturelle_akzeptanz', 'text', 'Mitarbeitende stehen neuen Technologien grundsätzlich offen gegenüber.'),
    jsonb_build_object('id', 'ka_2', 'dimension', 'kulturelle_akzeptanz', 'text', 'Führungskräfte unterstützen aktiv die Einführung von KI-Lösungen.'),
    jsonb_build_object('id', 'ka_3', 'dimension', 'kulturelle_akzeptanz', 'text', 'Es gibt Raum und Zeit, um neue Tools auszuprobieren und zu lernen.'),
    jsonb_build_object('id', 'ka_4', 'dimension', 'kulturelle_akzeptanz', 'text', 'Fehler im Umgang mit neuen Technologien werden als Lernchance gesehen.'),
    jsonb_build_object('id', 'gc_1', 'dimension', 'governance_compliance', 'text', 'Uns ist klar, welche rechtlichen Vorgaben (z. B. DSGVO, EU AI Act) für unseren KI-Einsatz gelten.'),
    jsonb_build_object('id', 'gc_2', 'dimension', 'governance_compliance', 'text', 'Es gibt – oder es ist geplant – eine interne Richtlinie zum Umgang mit KI-Tools.'),
    jsonb_build_object('id', 'gc_3', 'dimension', 'governance_compliance', 'text', 'Verantwortlichkeiten für Risikobewertung und Freigabe von KI-Anwendungen sind geklärt.')
  ),
  true,
  0
)
on conflict (slug) do nothing;

-- Bestehende, bereits abgeschlossene Assessments rückwirkend diesem
-- Template zuordnen (waren zuvor implizit alle "KI-Readiness").
update public.assessments
set template_id = (select id from public.assessment_templates where slug = 'ki-readiness')
where template_id is null;
