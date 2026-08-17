-- =============================================================
-- Neues Template: Organisations-Assessment zu vorhandenen Change-
-- Management-Fähigkeiten (Selbsteinschätzung auf Organisationsebene,
-- 9 Sektionen à 3 Items, Skala 0-2, Summen 0-6 je Sektion). Fachlich an
-- der Struktur der SAP-Vorlage "Managing the People Side of Change in
-- your Organization - Organizational Capability Assessment" orientiert,
-- Fragen und Empfehlungstexte eigenständig formuliert.
--
-- Die Skala 0-2 ("nicht vorhanden" / "teilweise vorhanden" / "vollständig
-- vorhanden") deckt sich nicht mit den bestehenden SCALE_LABELS-Fallback-
-- Texten (die für eine 1-5-Zustimmungsskala gedacht sind) - deshalb
-- bekommt hier jede Frage ein eigenes lowLabel/highLabel.
--
-- sections nutzt das neue optionale group-Feld, um die SAP-Gliederung in
-- "Allgemeine" und "Operative" Fähigkeiten nachzubilden (rein for
-- Anzeige-Zwecke, siehe TemplateSection in src/types/assessment.ts).
-- =============================================================
insert into public.assessment_templates (
  title, description, slug, scoring_mode, scale_min, scale_max, result_visualization, sections, questions, recommendations, is_active, sort_order
)
values (
  'Organisations-Assessment: Change-Fähigkeiten',
  'Schätzt ein, welche organisatorischen Fähigkeiten in eurem Unternehmen bereits vorhanden sind, um den Menschen im Wandel professionell zu begleiten.',
  'organisations-change-faehigkeiten',
  'section_sum',
  0,
  2,
  'bars',
  jsonb_build_array(
    jsonb_build_object('key', 'change_kultur', 'label', 'Change-Kultur', 'group', 'Allgemeine organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_erfahrung', 'label', 'Change-Erfahrung', 'group', 'Allgemeine organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_management_knowhow', 'label', 'Change-Management-Know-how', 'group', 'Allgemeine organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_aufsetzen', 'label', 'Change aufsetzen', 'group', 'Operative organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_fuehren', 'label', 'Change führen', 'group', 'Operative organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_kommunizieren', 'label', 'Change kommunizieren', 'group', 'Operative organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_umsetzen', 'label', 'Change umsetzen', 'group', 'Operative organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_ermoeglichen', 'label', 'Change ermöglichen', 'group', 'Operative organisatorische Fähigkeiten'),
    jsonb_build_object('key', 'change_ueberwachen', 'label', 'Change überwachen', 'group', 'Operative organisatorische Fähigkeiten')
  ),
  jsonb_build_array(
    jsonb_build_object('id', 'ck_1', 'sectionKey', 'change_kultur', 'text', 'Die Haltung, den Status quo aktiv zu hinterfragen und sich kontinuierlich zu verbessern, ist Teil der Unternehmens-DNA.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ck_2', 'sectionKey', 'change_kultur', 'text', 'Es gibt vertrauensvolle Zusammenarbeit und offene Kommunikation über Teams, Bereiche und Hierarchieebenen hinweg – auch während Veränderungsprojekten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ck_3', 'sectionKey', 'change_kultur', 'text', 'Mitarbeitende auf allen Ebenen stehen Veränderungen grundsätzlich offen gegenüber.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ce_1', 'sectionKey', 'change_erfahrung', 'text', 'Es gibt umfassende Erfahrung mit unterschiedlichen Arten von Veränderungsprojekten, z. B. Restrukturierung, Prozessoptimierung, Einführung von Standardsoftware.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ce_2', 'sectionKey', 'change_erfahrung', 'text', 'Es gibt ein gemeinsames Verständnis der unternehmensspezifischen Erfolgsfaktoren und Stolpersteine aus vergangenen Veränderungsprojekten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ce_3', 'sectionKey', 'change_erfahrung', 'text', 'Es gibt ein breites Bewusstsein für die Bedeutung und den Nutzen von Change Management in der Organisation.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cmk_1', 'sectionKey', 'change_management_knowhow', 'text', 'Es gibt einen systematischen Change-Management-Ansatz für Veränderungsprojekte.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cmk_2', 'sectionKey', 'change_management_knowhow', 'text', 'Es gibt eine etablierte Change-Management-Methodik mit Best-Practice-Tools und -Vorlagen (Toolbox).', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cmk_3', 'sectionKey', 'change_management_knowhow', 'text', 'Es gibt dedizierte interne Change-Management-Ressourcen zur Unterstützung von Veränderungsprojekten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ca_1', 'sectionKey', 'change_aufsetzen', 'text', 'Es ist üblich, people-bezogene Themen und Herausforderungen zu Beginn von Veränderungsprojekten systematisch zu bewerten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ca_2', 'sectionKey', 'change_aufsetzen', 'text', 'Es gibt praktische Erfahrung darin, Change-Management-Aktivitäten von Anfang an in Veränderungsprojekte zu integrieren.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ca_3', 'sectionKey', 'change_aufsetzen', 'text', 'Es ist gängige Praxis, Veränderungsprojekten Change-Management-Ressourcen zuzuweisen.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cf_1', 'sectionKey', 'change_fuehren', 'text', 'Das Top-Management ist grundsätzlich bereit, Veränderungsprojekte aktiv und sichtbar zu unterstützen, z. B. als Vorbild oder Projekt-Sponsor.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cf_2', 'sectionKey', 'change_fuehren', 'text', 'Es gibt Erfahrung darin, von Veränderungsprojekten betroffene Stakeholder-Gruppen zu identifizieren, zu bewerten und zu steuern.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cf_3', 'sectionKey', 'change_fuehren', 'text', 'Es gibt Erfahrung darin, dezentrale Netzwerke, z. B. Change Agents, zur Unterstützung von Veränderungsprojekten zu mobilisieren.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ck2_1', 'sectionKey', 'change_kommunizieren', 'text', 'Es stehen geeignete Kommunikationskanäle zur Verfügung, um unterschiedliche Stakeholder-Gruppen und ihre jeweiligen Informationsbedürfnisse zu erreichen.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ck2_2', 'sectionKey', 'change_kommunizieren', 'text', 'Es gibt Kommunikationsexpertise und dedizierte Kommunikationsressourcen zur Unterstützung von Veränderungsprojekten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ck2_3', 'sectionKey', 'change_kommunizieren', 'text', 'Es gibt Erfahrung darin, eine überzeugende „Change Story" für Veränderungsprojekte zu entwickeln und zu kommunizieren.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cu_1', 'sectionKey', 'change_umsetzen', 'text', 'Es gibt transparente, klar definierte End-to-End-Geschäftsprozesse inklusive dokumentierter Rollen und Verantwortlichkeiten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cu_2', 'sectionKey', 'change_umsetzen', 'text', 'Es gibt Erfahrung darin, die Auswirkungen von Veränderungsprojekten auf die Organisation zu bewerten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cu_3', 'sectionKey', 'change_umsetzen', 'text', 'Es gibt einen klaren Fokus darauf, Mitarbeitende beim Übergang vom Ist- in den Soll-Zustand zu unterstützen (organisatorisches Alignment).', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ce2_1', 'sectionKey', 'change_ermoeglichen', 'text', 'Es gibt breite Erfahrung mit unterschiedlichen Trainingsansätzen und -formaten.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ce2_2', 'sectionKey', 'change_ermoeglichen', 'text', 'Es gibt Kompetenz im Management groß angelegter Trainingsinitiativen.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'ce2_3', 'sectionKey', 'change_ermoeglichen', 'text', 'Es gibt Erfahrung darin, Lernerfolg nachzuverfolgen, z. B. die Umsetzung von Trainingsinhalten in die Praxis.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cue_1', 'sectionKey', 'change_ueberwachen', 'text', 'Es gibt Ansätze und Tools, um den Fortschritt und Erfolg von Veränderungsprojekten zu messen.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cue_2', 'sectionKey', 'change_ueberwachen', 'text', 'Es werden systematisch „Lessons Learned"-Sessions während und nach Veränderungsprojekten durchgeführt.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden'),
    jsonb_build_object('id', 'cue_3', 'sectionKey', 'change_ueberwachen', 'text', 'Es gibt Kennzahlen (KPIs) für „weiche" Change-Themen, z. B. Zufriedenheit, Change-Bereitschaft, User Adoption.', 'lowLabel', 'Nicht vorhanden', 'highLabel', 'Vollständig vorhanden')
  ),
  jsonb_build_object(
    'bySection', jsonb_build_object(
      'change_kultur', jsonb_build_object(
        'low', 'Eure Change-Kultur unterscheidet sich vermutlich deutlich von dem, was für die maximale Wirkung eures Projekts nötig wäre. Das lässt sich nicht kurzfristig ändern – aber Bewusstsein für die kulturelle Lücke zu schaffen und offen darüber zu sprechen, ist der erste Schritt zu einem Kulturwandel.',
        'high', 'Eure Change-Kultur ist eine gute Basis, um vorherzusehen, wie betroffene Nutzende reagieren werden, und um people-bezogene Herausforderungen frühzeitig einzuschätzen.'
      ),
      'change_erfahrung', jsonb_build_object(
        'low', 'Ohne Erfahrung aus früheren Veränderungsprojekten lohnt sich ein Workshop oder Interviews mit relevanten Stakeholdern, um Lessons Learned zu heben. Auch informelle Gespräche mit erfahrenen Führungskräften oder Projektleitungen können wertvolle Einblicke liefern und davor bewahren, vergangene Fehler zu wiederholen.',
        'high', 'Eure Erfahrung aus früheren Veränderungsprojekten ist eine wertvolle Grundlage – nutzt sie aktiv, um Lessons Learned in euer aktuelles Projekt einfließen zu lassen.'
      ),
      'change_management_knowhow', jsonb_build_object(
        'low', 'Change-Management-Know-how lässt sich vergleichsweise schnell aufbauen: externe Trainings, interne Schulungen, der Austausch mit erfahreneren Unternehmen oder die Zusammenarbeit mit professioneller Beratung sind gute Ausgangspunkte.',
        'high', 'Euer Change-Management-Know-how ist eine gute Grundlage, um einen unternehmensspezifischen Ansatz weiterzuentwickeln.'
      ),
      'change_aufsetzen', jsonb_build_object(
        'low', 'Ein guter Start ins Change Management legt das Fundament für alles Weitere. Wenn die nötigen Voraussetzungen fehlen, holt euch frühzeitig externe Expertise und sorgt dafür, dass Aufgaben und Verantwortlichkeiten im Projekt klar dokumentiert und kommuniziert sind.',
        'high', 'Ihr habt eine gute Basis, um Change Management von Anfang an fest in eure Projektorganisation zu integrieren.'
      ),
      'change_fuehren', jsonb_build_object(
        'low', 'Schafft zunächst Bewusstsein dafür, dass unterschiedliche Stakeholder-Gruppen unterschiedlich auf Veränderung reagieren. Das Top-Management muss aktiv als Sponsor und Vorbild gewonnen werden, und die Mobilisierung von Change Agents sollte frühzeitig starten, damit genug Zeit für Wissensaufbau bleibt.',
        'high', 'Ihr könnt auf Erfahrung im Umgang mit Stakeholdern und der Mobilisierung von Sponsoren und Change Agents aufbauen.'
      ),
      'change_kommunizieren', jsonb_build_object(
        'low', 'Beginnt mit einer klaren Aufbereitung der Kernbotschaften als Referenz für alle Kommunikationsaktivitäten. Ein offener Austausch mit verschiedenen Zielgruppen zu ihren Bedürfnissen hilft ebenso wie externe Kommunikationsexpertise beim Aufbau der nötigen Ressourcen.',
        'high', 'Eure Kommunikationsexpertise ist eine gute Grundlage, um eine überzeugende Change Story für das Projekt zu entwickeln.'
      ),
      'change_umsetzen', jsonb_build_object(
        'low', 'Schafft Bewusstsein dafür, dass die Umsetzung von Veränderung ein Prozess ist, der sorgfältig vorbereitet werden muss. Der Schulterschluss mit internen Expert:innen, insbesondere HR, hilft dabei ebenso wie ein Pilot in einem kleinen Bereich, um erste Erfahrungen zu sammeln.',
        'high', 'Eure Erfahrung mit der Umsetzung von Veränderung ist eine gute Grundlage, um Mitarbeitende gezielt vom Ist- in den Soll-Zustand zu begleiten.'
      ),
      'change_ermoeglichen', jsonb_build_object(
        'low', 'Kompetenzlücken beim Enablement sollten ernst genommen werden, da gutes Training ein zentraler Erfolgsfaktor ist. Prüft offen eine Make-or-Buy-Entscheidung: Standardisierte Trainingsangebote kombiniert mit externer Beratung sind oft ein guter Weg, um gleichzeitig internes Know-how aufzubauen. Wartet damit nicht zu lange.',
        'high', 'Eure Trainingskompetenz ist eine gute Basis, um Nutzende gezielt für das Projekt zu befähigen.'
      ),
      'change_ueberwachen', jsonb_build_object(
        'low', 'Eine Kompetenzlücke beim Monitoring muss nicht eure erste Priorität sein – andere Aspekte wie Kommunikation und Training sind meist wichtiger für den Projekterfolg. Ein einfacher, wirkungsvoller erster Schritt sind regelmäßige Lessons-Learned-Sessions; wer erste KPI-Erfahrung sammeln will, sollte mit User Adoption starten, der zentralen Erfolgskennzahl.',
        'high', 'Ihr könnt auf Erfahrung beim Monitoring von Veränderung aufbauen, um Change-Aktivitäten gezielt nachzujustieren.'
      )
    ),
    'overall', jsonb_build_object(
      'low', 'Kombiniert dieses Ergebnis idealerweise mit dem des Projekt-Assessments: Zusammen ergeben sie ein Gesamtbild aus dem Änderungsbedarf eures Projekts und den organisatorischen Fähigkeiten, die ihr dafür bereits mitbringt.',
      'high', 'Kombiniert dieses Ergebnis idealerweise mit dem des Projekt-Assessments: Zusammen ergeben sie ein Gesamtbild aus dem Änderungsbedarf eures Projekts und den organisatorischen Fähigkeiten, die ihr dafür bereits mitbringt.'
    )
  ),
  true,
  3
)
on conflict (slug) do nothing;
