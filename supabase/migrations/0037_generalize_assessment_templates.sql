-- =============================================================
-- Generalisiert assessment_templates von "eine feste Form (4 KI-
-- Dimensionen, Skala 1-5, 0-100-Score)" zu konfigurierbarer Form, damit
-- neben dem KI-Readiness-Check auch summenbasierte Assessments (z. B.
-- ein Change-Management-Bedarfs-Check nach dem Muster "SAP Project
-- Assessment") als Template abgebildet werden können.
-- =============================================================

alter table public.assessment_templates
  add column scoring_mode text not null default 'dimension_average'
    check (scoring_mode in ('dimension_average', 'section_sum')),
  add column scale_min integer not null default 1,
  add column scale_max integer not null default 5,
  add column sections jsonb not null default '[
    {"key": "datenqualitaet", "label": "Datenqualität"},
    {"key": "prozessklarheit", "label": "Prozessklarheit"},
    {"key": "kulturelle_akzeptanz", "label": "Kulturelle Akzeptanz"},
    {"key": "governance_compliance", "label": "Governance & Compliance"}
  ]'::jsonb;

comment on column public.assessment_templates.scoring_mode is
  'dimension_average = Mittelwert je Sektion auf 0-100 skaliert (KI-Readiness-Verhalten), section_sum = Summe je Sektion, Interpretation über scale_min/max * Fragenanzahl.';
comment on column public.assessment_templates.scale_min is 'Untere Grenze der Antwortskala (z. B. 1).';
comment on column public.assessment_templates.scale_max is 'Obere Grenze der Antwortskala (z. B. 5 oder 7).';
comment on column public.assessment_templates.sections is
  'Array aus { key, label }. Ersetzt die früher global fixe ASSESSMENT_DIMENSIONS-Konstante als Quelle der Wahrheit je Template.';

-- Das Default oben entspricht exakt den bisherigen globalen KI-Dimensionen,
-- damit die bestehende Zeile ohne weiteres Zutun unverändert bleibt.

-- questions[].dimension -> questions[].sectionKey (generischerer Name,
-- da "dimension" jetzt template-spezifisch statt global fix ist).
update public.assessment_templates
set questions = (
  select jsonb_agg(
    (q - 'dimension') || jsonb_build_object('sectionKey', q -> 'dimension')
  )
  from jsonb_array_elements(questions) as q
)
where questions <> '[]'::jsonb;

comment on column public.assessment_templates.questions is
  'Array aus { id, sectionKey, text, lowLabel?, highLabel? }. sectionKey referenziert einen key aus sections. lowLabel/highLabel sind optionale Anker-Beschriftungen an den Skalen-Enden (z. B. "wenige" / "viele"), fallen sonst auf SCALE_LABELS zurück.';

-- recommendations.byDimension -> recommendations.bySection
update public.assessment_templates
set recommendations = (recommendations - 'byDimension')
  || jsonb_build_object('bySection', recommendations -> 'byDimension')
where recommendations ? 'byDimension';

comment on column public.assessment_templates.recommendations is
  'Form: { bySection: { <sectionKey>: {low[,medium],high} }, overall: {low[,medium],high} }. Tier-Set hängt von scoring_mode ab: dimension_average = low/medium/high (Grenzen <40/<70), section_sum = low/high (Split am Mittelpunkt von Fragenanzahl*scale_min..scale_max).';

-- =============================================================
-- Neues Template: Change-Management-Bedarfs-Check (summenbasiert,
-- Skala 1-7, 4 Sektionen à 4 Fragen). Fachlich an der Struktur der SAP-
-- Vorlage "Identifying People-Related Challenges of your Cloud Project"
-- orientiert, Fragen und Empfehlungstexte eigenständig formuliert und
-- themenneutral gehalten (nicht auf "Cloud" beschränkt), passend zur
-- bestehenden, themenneutralen Ausrichtung der App.
-- =============================================================
insert into public.assessment_templates (
  title, description, slug, scoring_mode, scale_min, scale_max, sections, questions, recommendations, is_active, sort_order
)
values (
  'Projekt-Assessment: Change-Management-Bedarf',
  'Finde heraus, wie hoch der Bedarf an Change Management für dein IT- oder Organisationsprojekt ist – anhand von Komplexität, Veränderungswirkung, Stakeholder-Landschaft und strategischer Relevanz.',
  'change-management-bedarf',
  'section_sum',
  1,
  7,
  jsonb_build_array(
    jsonb_build_object('key', 'komplexitaet', 'label', 'Komplexität des Projekts'),
    jsonb_build_object('key', 'veraenderungswirkung', 'label', 'Erwartete Veränderungswirkung'),
    jsonb_build_object('key', 'stakeholder', 'label', 'Stakeholder-Landschaft'),
    jsonb_build_object('key', 'strategische_relevanz', 'label', 'Strategische Relevanz')
  ),
  jsonb_build_array(
    jsonb_build_object('id', 'kx_1', 'sectionKey', 'komplexitaet', 'text', 'Wie viele Mitarbeitende sind von dem Projekt betroffen?', 'lowLabel', 'wenige Mitarbeitende', 'highLabel', 'viele Mitarbeitende'),
    jsonb_build_object('id', 'kx_2', 'sectionKey', 'komplexitaet', 'text', 'Wie viele Geschäftsprozesse sind von dem Projekt betroffen?', 'lowLabel', 'wenige Prozesse', 'highLabel', 'viele Prozesse'),
    jsonb_build_object('id', 'kx_3', 'sectionKey', 'komplexitaet', 'text', 'Wie viele Bereiche, Standorte oder Gesellschaften sind von dem Projekt betroffen?', 'lowLabel', 'wenige Bereiche', 'highLabel', 'viele Bereiche'),
    jsonb_build_object('id', 'kx_4', 'sectionKey', 'komplexitaet', 'text', 'Wie divers ist die betroffene Belegschaft, z. B. hinsichtlich Nationalitäten oder Kulturen?', 'lowLabel', 'geringe Vielfalt', 'highLabel', 'hohe Vielfalt'),
    jsonb_build_object('id', 'vw_1', 'sectionKey', 'veraenderungswirkung', 'text', 'Wie umfangreich sind die erwarteten Prozessänderungen, z. B. Standardisierung oder Automatisierung?', 'lowLabel', 'geringer Umfang', 'highLabel', 'hoher Umfang'),
    jsonb_build_object('id', 'vw_2', 'sectionKey', 'veraenderungswirkung', 'text', 'Wie umfangreich sind die erwarteten technologischen Änderungen, z. B. neue Oberflächen, Geräte oder Funktionen?', 'lowLabel', 'geringer Umfang', 'highLabel', 'hoher Umfang'),
    jsonb_build_object('id', 'vw_3', 'sectionKey', 'veraenderungswirkung', 'text', 'Wie umfangreich sind die erwarteten organisatorischen Änderungen, z. B. neue Rollen, Verantwortlichkeiten oder Berichtslinien?', 'lowLabel', 'geringer Umfang', 'highLabel', 'hoher Umfang'),
    jsonb_build_object('id', 'vw_4', 'sectionKey', 'veraenderungswirkung', 'text', 'Wie umfangreich sind die nötigen Kompetenz- und Mindset-Veränderungen, z. B. neue Arbeitsweisen oder Schulungsbedarf?', 'lowLabel', 'geringer Umfang', 'highLabel', 'hoher Umfang'),
    jsonb_build_object('id', 'st_1', 'sectionKey', 'stakeholder', 'text', 'Wie hoch ist der erwartete Aufwand, sichtbares Top-Management-Sponsoring aufzubauen?', 'lowLabel', 'geringer Aufwand', 'highLabel', 'hoher Aufwand'),
    jsonb_build_object('id', 'st_2', 'sectionKey', 'stakeholder', 'text', 'Wie hoch ist der erwartete Aufwand, ein breites Führungskräfte-Alignment über alle Ebenen herzustellen?', 'lowLabel', 'geringer Aufwand', 'highLabel', 'hoher Aufwand'),
    jsonb_build_object('id', 'st_3', 'sectionKey', 'stakeholder', 'text', 'Wie hoch ist der erwartete Widerstand bei den betroffenen Nutzenden?', 'lowLabel', 'geringer Widerstand', 'highLabel', 'hoher Widerstand'),
    jsonb_build_object('id', 'st_4', 'sectionKey', 'stakeholder', 'text', 'Wie viele Konflikte zwischen Fachbereich und IT werden erwartet, z. B. beim Tempo oder Standardisierungsgrad?', 'lowLabel', 'wenige Konflikte', 'highLabel', 'viele Konflikte'),
    jsonb_build_object('id', 'sr_1', 'sectionKey', 'strategische_relevanz', 'text', 'Wie bedeutend ist das Projekt für die Organisation?', 'lowLabel', 'geringe Bedeutung', 'highLabel', 'hohe Bedeutung'),
    jsonb_build_object('id', 'sr_2', 'sectionKey', 'strategische_relevanz', 'text', 'Wie dringlich ist das Projekt für die Organisation?', 'lowLabel', 'geringe Dringlichkeit', 'highLabel', 'hohe Dringlichkeit'),
    jsonb_build_object('id', 'sr_3', 'sectionKey', 'strategische_relevanz', 'text', 'Wie groß ist der strategische Wandel bzw. Anpassungsbedarf, den das Projekt auslöst?', 'lowLabel', 'geringer Wandel', 'highLabel', 'hoher Wandel'),
    jsonb_build_object('id', 'sr_4', 'sectionKey', 'strategische_relevanz', 'text', 'Wie hoch ist der erwartete Aufwand, das große Ganze und das "Warum" des Projekts im Unternehmen zu vermitteln?', 'lowLabel', 'geringer Aufwand', 'highLabel', 'hoher Aufwand')
  ),
  jsonb_build_object(
    'bySection', jsonb_build_object(
      'komplexitaet', jsonb_build_object(
        'low', 'Das Projekt betrifft aktuell nur wenige Mitarbeitende, Prozesse und Bereiche – der Koordinationsaufwand bleibt überschaubar. Auch bei geringer Komplexität lohnt sich ein Blick auf die anderen Sektionen, bevor ihr auf Change Management verzichtet.',
        'high', 'Viele Mitarbeitende, Prozesse und Bereiche sind betroffen, dazu eine diverse Belegschaft – die Wahrscheinlichkeit für Reibungsverluste und Widerstand steigt deutlich. Change Management sollte hier von Projektstart an fest eingeplant sein.'
      ),
      'veraenderungswirkung', jsonb_build_object(
        'low', 'Die erwarteten Prozess-, Technologie- und Rollenänderungen sind eher gering – die Umstellung für die Belegschaft bleibt überschaubar.',
        'high', 'Prozesse, Technologie, Rollen und Arbeitsweisen verändern sich stark. Plant Change-Aktivitäten frühzeitig und stellt sicher, dass die betroffenen Bereiche rechtzeitig vor Go-live genug Kapazität für die Umstellung haben.'
      ),
      'stakeholder', jsonb_build_object(
        'low', 'Sponsoring, Führungskräfte-Alignment und Widerstände erfordern aktuell wenig zusätzlichen Aufwand.',
        'high', 'Sponsoring, Führungskräfte-Alignment und mögliche Konflikte zwischen Fachbereich und IT brauchen spürbaren Einsatz. Interne Ressourcen mit gutem Stakeholder-Netzwerk sind hier oft wirksamer als externe Berater:innen ohne internen Draht.'
      ),
      'strategische_relevanz', jsonb_build_object(
        'low', 'Das Projekt hat aktuell eine eher geringe strategische Sichtbarkeit – Kommunikationsaufwand und Top-Management-Einbindung können schlank gehalten werden.',
        'high', 'Das Projekt ist strategisch hoch relevant. Bindet einen sichtbaren, gut vernetzten Sponsor ein und plant genug Kommunikationsaufwand ein, um das "Warum" im Unternehmen glaubhaft zu vermitteln.'
      )
    ),
    'overall', jsonb_build_object(
      'low', 'Der Änderungsbedarf ist aktuell eher gering ausgeprägt. Das heißt nicht, dass Change Management verzichtbar ist: Bindet IT- und Fachbereichsleitung früh ein und benennt intern eine verantwortliche Person, die das Thema im Blick behält und bei Bedarf gegensteuert.',
      'high', 'Der Änderungsbedarf ist hoch. Plant eine dedizierte Change-Management-Rolle oder ein kleines Team ein, kombiniert bei Bedarf externe Beratung mit internem Know-how und erwägt zusätzliche Rollen wie Change Agents oder Key User, um die Veränderung in alle betroffenen Bereiche zu tragen.'
    )
  ),
  true,
  1
)
on conflict (slug) do nothing;
