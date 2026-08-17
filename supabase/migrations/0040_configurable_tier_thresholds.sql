-- =============================================================
-- Bislang waren die Grenzwerte, ab denen eine Handlungsempfehlung als
-- "niedrig"/"mittel"/"hoch" gilt, global im Code fixiert (0-100: <40/<70,
-- siehe src/data/result-copy.ts) bzw. implizit der rechnerische
-- Mittelpunkt des Wertebereichs (section_sum). Damit ließ sich die
-- fachlich sinnvolle Grenze eines künftigen Templates nicht abbilden,
-- falls sie nicht zufällig mit dem Mittelpunkt zusammenfällt. Diese
-- Migration macht die Grenzwerte pro Template optional konfigurierbar,
-- ohne das Verhalten bestehender Templates zu ändern (Default null =
-- bisheriges Verhalten bleibt exakt erhalten).
-- =============================================================
alter table public.assessment_templates
  add column tier_low_max integer,
  add column tier_medium_max integer,
  add column section_sum_high_threshold numeric;

comment on column public.assessment_templates.tier_low_max is
  'Nur für scoring_mode=dimension_average: Score < tier_low_max -> "low". null = Standardgrenze 40 aus src/data/result-copy.ts.';
comment on column public.assessment_templates.tier_medium_max is
  'Nur für scoring_mode=dimension_average: Score < tier_medium_max -> "medium", sonst "high". null = Standardgrenze 70.';
comment on column public.assessment_templates.section_sum_high_threshold is
  'Nur für scoring_mode=section_sum: Summe >= section_sum_high_threshold -> "high", sonst "low". null = Mittelpunkt von [Fragenanzahl*scale_min, ..*scale_max] (bisheriges Verhalten).';
