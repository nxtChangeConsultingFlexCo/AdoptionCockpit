-- Handlungsempfehlungen pro Template: je Dimension low/medium/high,
-- optional eine Gesamtempfehlung nach Gesamtscore (ebenfalls
-- low/medium/high). Ersetzt die bisher hartcodierten Texte in
-- src/data/result-copy.ts - god pflegt sie jetzt pro Template über den
-- Admin-Editor.
alter table public.assessment_templates
  add column recommendations jsonb not null default '{}'::jsonb;

comment on column public.assessment_templates.recommendations is
  'Form: { byDimension: { <dimension>: { low, medium, high } }, overall: { low, medium, high } }. Tier-Grenzen: low <40, medium <70, sonst high.';

update public.assessment_templates
set recommendations = jsonb_build_object(
  'byDimension', jsonb_build_object(
    'datenqualitaet', jsonb_build_object(
      'low', 'Eure Datenbasis ist aktuell verstreut und schwer greifbar – hier liegt der wichtigste Hebel, bevor KI-Projekte skalieren können.',
      'medium', 'Eure Daten sind teilweise strukturiert, aber Vollständigkeit und Aktualität schwanken noch spürbar. Klare Verantwortlichkeiten helfen, das zu verfestigen.',
      'high', 'Eure Daten sind überwiegend zentral verfügbar und gepflegt – eine solide bis exzellente Basis für den produktiven KI-Einsatz.'
    ),
    'prozessklarheit', jsonb_build_object(
      'low', 'Prozesse und Zuständigkeiten sind bislang kaum dokumentiert – ohne Klarheit hier bleibt KI-Automatisierung Stückwerk.',
      'medium', 'Kernprozesse sind teilweise beschrieben, Schnittstellen und Verantwortlichkeiten aber noch nicht durchgängig klar.',
      'high', 'Eure Prozesse sind gut dokumentiert und nachvollziehbar – ein gutes Fundament, um gezielt zu automatisieren.'
    ),
    'kulturelle_akzeptanz', jsonb_build_object(
      'low', 'Neue Technologien stoßen aktuell eher auf Zurückhaltung – Change-Begleitung wird ein zentraler Erfolgsfaktor sein.',
      'medium', 'Die Offenheit wächst, hängt aber noch stark von einzelnen Personen und Teams ab.',
      'high', 'Mitarbeitende und Führung stehen KI-Themen überwiegend aufgeschlossen gegenüber – ein guter Nährboden für Veränderung.'
    ),
    'governance_compliance', jsonb_build_object(
      'low', 'Rechtliche Leitplanken und Verantwortlichkeiten für KI-Einsatz fehlen noch weitgehend – hier besteht akuter Klärungsbedarf.',
      'medium', 'Erste Überlegungen zu Richtlinien und Verantwortlichkeiten existieren, sind aber noch nicht verbindlich verankert.',
      'high', 'Governance-Strukturen und Verantwortlichkeiten für KI sind weitgehend klar geregelt – ihr agiert compliant und risikobewusst.'
    )
  ),
  'overall', jsonb_build_object(
    'low', 'Ihr steht am Anfang eurer KI-Readiness-Reise. Die gute Nachricht: Die größten Hebel sind identifizierbar – mit gezielten ersten Schritten schafft ihr schnell eine solide Basis.',
    'medium', 'Euer Unternehmen verfügt über eine solide Basis für den KI-Einsatz. Mit gezielten nächsten Schritten könnt ihr das Tempo weiter erhöhen.',
    'high', 'Euer Unternehmen zählt zu den Vorreitern in Sachen KI-Readiness. Jetzt zählt es, das Momentum zu halten und die Wirkung zu skalieren.'
  )
)
where slug = 'ki-readiness';
