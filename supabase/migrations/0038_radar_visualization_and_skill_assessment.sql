-- =============================================================
-- Ergebnis-Visualisierung wird pro Template konfigurierbar (bislang
-- rendert jedes section_sum-Template lineare Balken je Sektion, siehe
-- Migration 0037). Für ein persönliches 5-Achsen-Skill-Profil ist ein
-- Spinnennetz-/Radar-Diagramm die passendere Darstellung (analog zur
-- SAP-Vorlage "Individual Skill Assessment", die ihr Ergebnis exakt so
-- als Pentagon abbildet).
-- =============================================================
alter table public.assessment_templates
  add column result_visualization text not null default 'bars'
    check (result_visualization in ('bars', 'radar'));

comment on column public.assessment_templates.result_visualization is
  'bars = lineare SectionScaleCard je Sektion (bisheriges Verhalten), radar = zusätzliches Spinnennetz-Diagramm als Ergebnis-Hero. Nur relevant für scoring_mode = section_sum.';

-- =============================================================
-- Neues Template: persönliches Skill-Profil für die Change-Manager-Rolle
-- (Selbsteinschätzung, 5 Sektionen à 5 Items, Skala 1-5, Summen 5-25 je
-- Sektion). Fachlich an der Struktur der SAP-Vorlage "Acting as a Change
-- Manager in your Cloud Project - Individual Skill Assessment"
-- orientiert, Fragen und Empfehlungstexte eigenständig formuliert. Die
-- Skala 1-5 "Stimme nicht zu"..."Stimme zu" deckt sich mit den
-- bestehenden SCALE_LABELS-Fallback-Texten, daher keine eigenen
-- lowLabel/highLabel je Frage nötig.
-- =============================================================
insert into public.assessment_templates (
  title, description, slug, scoring_mode, scale_min, scale_max, result_visualization, sections, questions, recommendations, is_active, sort_order
)
values (
  'Individual Skill Assessment: Change-Manager-Skill-Profil',
  'Finde in einer Selbsteinschätzung heraus, wo deine Stärken liegen und wo du dich weiterentwickeln kannst, um als Change Manager in deinem Projekt erfolgreich zu sein.',
  'change-manager-skillprofil',
  'section_sum',
  1,
  5,
  'radar',
  jsonb_build_array(
    jsonb_build_object('key', 'persoenliche_eigenschaften', 'label', 'Persönliche Eigenschaften'),
    jsonb_build_object('key', 'soft_skills', 'label', 'Soft Skills'),
    jsonb_build_object('key', 'methodische_faehigkeiten', 'label', 'Methodische Fähigkeiten'),
    jsonb_build_object('key', 'fachwissen', 'label', 'Fachwissen'),
    jsonb_build_object('key', 'praktische_erfahrung', 'label', 'Praktische Erfahrung')
  ),
  jsonb_build_array(
    jsonb_build_object('id', 'pe_1', 'sectionKey', 'persoenliche_eigenschaften', 'text', 'Ich bin ein optimistischer Mensch und gehe auch herausfordernde Situationen mit einer positiven, konstruktiven Haltung an.'),
    jsonb_build_object('id', 'pe_2', 'sectionKey', 'persoenliche_eigenschaften', 'text', 'Ich kann mich gut in andere hineinversetzen und ihre Gefühle und Handlungen nachvollziehen, auch wenn ich ihre Meinung nicht teile.'),
    jsonb_build_object('id', 'pe_3', 'sectionKey', 'persoenliche_eigenschaften', 'text', 'Auch in unsicheren, mehrdeutigen Situationen fühle ich mich wohl, passe mich schnell an und reagiere flexibel auf neue Erkenntnisse.'),
    jsonb_build_object('id', 'pe_4', 'sectionKey', 'persoenliche_eigenschaften', 'text', 'Ich gehe neue Herausforderungen mit viel Kreativität und Out-of-the-box-Denken an.'),
    jsonb_build_object('id', 'pe_5', 'sectionKey', 'persoenliche_eigenschaften', 'text', 'Ich nehme mir regelmäßig Zeit für Selbstreflexion, um mich selbst besser zu führen, zu motivieren und meine Ziele zu erreichen.'),
    jsonb_build_object('id', 'ss_1', 'sectionKey', 'soft_skills', 'text', 'Ich habe ausgezeichnete kommunikative Fähigkeiten und kann klare, überzeugende Botschaften formulieren sowie aktiv zuhören.'),
    jsonb_build_object('id', 'ss_2', 'sectionKey', 'soft_skills', 'text', 'Ich kann gut mit Menschen auf allen Ebenen einer Organisation und mit unterschiedlichen kulturellen Hintergründen in Kontakt treten.'),
    jsonb_build_object('id', 'ss_3', 'sectionKey', 'soft_skills', 'text', 'Ich bin ein engagierter Teamplayer, der gerne kollaborativ arbeitet und zu gutem Teamgeist beiträgt.'),
    jsonb_build_object('id', 'ss_4', 'sectionKey', 'soft_skills', 'text', 'Ich bin gut darin, starke Beziehungen aufzubauen und unterschiedliche Persönlichkeiten in ein Netzwerk zu integrieren.'),
    jsonb_build_object('id', 'ss_5', 'sectionKey', 'soft_skills', 'text', 'Ich kann andere beeinflussen und für ein gemeinsames Ziel motivieren, auch ohne formale Führungsposition.'),
    jsonb_build_object('id', 'mf_1', 'sectionKey', 'methodische_faehigkeiten', 'text', 'Ich habe starke Projektmanagement-Fähigkeiten, inklusive praktischer Erfahrung mit agilen Methoden.'),
    jsonb_build_object('id', 'mf_2', 'sectionKey', 'methodische_faehigkeiten', 'text', 'Ich kann komplexe Themen analysieren, strukturieren und in handhabbare Teilschritte zerlegen.'),
    jsonb_build_object('id', 'mf_3', 'sectionKey', 'methodische_faehigkeiten', 'text', 'Meine ausgeprägten Problemlösefähigkeiten helfen mir, pragmatische Lösungen für den Kern eines Problems zu finden.'),
    jsonb_build_object('id', 'mf_4', 'sectionKey', 'methodische_faehigkeiten', 'text', 'Ich habe ausgezeichnete Moderationsfähigkeiten, sowohl vor Ort als auch virtuell, auch bei großen Gruppen.'),
    jsonb_build_object('id', 'mf_5', 'sectionKey', 'methodische_faehigkeiten', 'text', 'Ich habe gute Mediationsfähigkeiten, die einen konstruktiven Dialog zwischen Konfliktparteien fördern und zu tragfähigen Lösungen führen.'),
    jsonb_build_object('id', 'fw_1', 'sectionKey', 'fachwissen', 'text', 'Ich habe ein solides Verständnis grundlegender Change-Management-Theorien und -Konzepte.'),
    jsonb_build_object('id', 'fw_2', 'sectionKey', 'fachwissen', 'text', 'Ich weiß, wie Menschen organisatorische Veränderungen durchlaufen, und kenne die typischen Emotionen der einzelnen Phasen.'),
    jsonb_build_object('id', 'fw_3', 'sectionKey', 'fachwissen', 'text', 'Ich beherrsche sowohl grundlegende Change-Management-Tools als auch die Konzeption von Trainingsmaßnahmen.'),
    jsonb_build_object('id', 'fw_4', 'sectionKey', 'fachwissen', 'text', 'Mein unternehmerisches Verständnis hilft mir, organisatorische Herausforderungen in Veränderungsprozessen zu erkennen und einzuordnen.'),
    jsonb_build_object('id', 'fw_5', 'sectionKey', 'fachwissen', 'text', 'Ich habe eine gute digitale Grundkompetenz und kenne mich mit digitalen Tools und Technologien zur Unterstützung von Veränderungsprozessen aus.'),
    jsonb_build_object('id', 'px_1', 'sectionKey', 'praktische_erfahrung', 'text', 'Ich habe praktische Erfahrung im Projektmanagement, sowohl als Teammitglied als auch in (Teil-)Projektleitung.'),
    jsonb_build_object('id', 'px_2', 'sectionKey', 'praktische_erfahrung', 'text', 'Ich habe verschiedene Arten organisatorischer Veränderungen erlebt, z. B. Restrukturierung, Fusion oder Kostensenkung.'),
    jsonb_build_object('id', 'px_3', 'sectionKey', 'praktische_erfahrung', 'text', 'Ich habe konkrete Erfahrung mit IT-getriebenem Wandel, z. B. der Einführung neuer Software oder Digitalisierungsprogrammen.'),
    jsonb_build_object('id', 'px_4', 'sectionKey', 'praktische_erfahrung', 'text', 'Ich war bereits Teil eines Veränderungsprojekts, das durch professionelles Change Management begleitet wurde.'),
    jsonb_build_object('id', 'px_5', 'sectionKey', 'praktische_erfahrung', 'text', 'Ich habe bereits Verantwortung dafür übernommen, andere durch Veränderungen zu führen – beruflich oder privat.')
  ),
  jsonb_build_object(
    'bySection', jsonb_build_object(
      'persoenliche_eigenschaften', jsonb_build_object(
        'low', 'Persönliche Eigenschaften sind stabile Anteile deiner Persönlichkeit, die sich nicht leicht trainieren lassen. Wenn hier wenig zusammenkommt, überlege dir gezielt, welche Aufgaben du an Teammitglieder mit den entsprechenden Stärken abgeben kannst – und starte selbst klein, mit überschaubaren Aktivitäten.',
        'high', 'Deine persönlichen Eigenschaften passen gut zum Change-Manager-Profil – eine wichtige Voraussetzung für die Rolle. Ein Austausch oder Shadowing mit einer erfahrenen Change-Management-Person kann helfen, diese Stärken gezielt in die Praxis zu übersetzen.'
      ),
      'soft_skills', jsonb_build_object(
        'low', 'Anders als persönliche Eigenschaften lassen sich Soft Skills gut trainieren. Formuliere konkrete Verhaltensziele, hole dir aktiv Feedback von anderen und ziehe passende Trainings in Betracht.',
        'high', 'Deine Soft Skills sind eine wertvolle Basis für die Zusammenarbeit mit unterschiedlichsten Stakeholdern. Nutze sie gezielt, um Vertrauen aufzubauen und andere für Veränderungen zu gewinnen.'
      ),
      'methodische_faehigkeiten', jsonb_build_object(
        'low', 'Methodische Fähigkeiten lassen sich gut in kleinen, sicheren Schritten aufbauen – etwa durch Selbststudium und das Anwenden einzelner Methoden in überschaubaren Situationen, z. B. der Moderation eines Team-Meetings.',
        'high', 'Deine methodischen Fähigkeiten helfen dir, auch komplexe, mehrdeutige Themen zu strukturieren und anzugehen. Ein vertiefendes Training, z. B. in Design Thinking oder Konfliktmoderation, kann diese Stärke weiter ausbauen.'
      ),
      'fachwissen', jsonb_build_object(
        'low', 'Change-Management-Fachwissen lässt sich gut im Selbststudium aufbauen, idealerweise kombiniert mit praktischer Anwendung oder einer entsprechenden Weiterbildung. Alternativ hilft es, gezielt Expert:innen ins Projektteam zu holen.',
        'high', 'Dein Fachwissen gibt dir ein solides Fundament, um Veränderungsprozesse fundiert einzuordnen und zu gestalten.'
      ),
      'praktische_erfahrung', jsonb_build_object(
        'low', 'Praktische Erfahrung wächst über Zeit und lässt sich nicht kurzfristig aufholen. Übernimm gezielt Aufgaben in Veränderungsinitiativen und hole dir Feedback von erfahrenen Kolleg:innen – "on the job learning" ist hier besonders wirksam.',
        'high', 'Deine praktische Erfahrung ist eine wichtige Grundlage, um Veränderungsprozesse souverän zu begleiten.'
      )
    ),
    'overall', jsonb_build_object(
      'low', 'Egal ob du bereits professionell im Change Management unterwegs bist oder gerade erst startest: Die Rolle als Change Manager ist eine gute Gelegenheit, Fähigkeiten aufzubauen, die dir auch in anderen Projekten nützen. Wiederhole die Selbsteinschätzung während oder nach deinem Projekt, um deine Entwicklung sichtbar zu machen.',
      'high', 'Egal ob du bereits professionell im Change Management unterwegs bist oder gerade erst startest: Die Rolle als Change Manager ist eine gute Gelegenheit, Fähigkeiten aufzubauen, die dir auch in anderen Projekten nützen. Wiederhole die Selbsteinschätzung während oder nach deinem Projekt, um deine Entwicklung sichtbar zu machen.'
    )
  ),
  true,
  2
)
on conflict (slug) do nothing;
