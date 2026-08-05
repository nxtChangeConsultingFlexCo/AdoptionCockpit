-- Wording-Vereinheitlichung: "Assessment" -> "Check" in nutzersichtbaren
-- Texten. Tabellen-/Spaltennamen bleiben unverändert (siehe
-- Anforderung), hier geht es nur um gespeicherte Anzeige-Texte
-- (Template-Titel), nicht um Code.
update public.assessment_templates
set title = replace(title, 'Assessment', 'Check')
where title like '%Assessment%';
