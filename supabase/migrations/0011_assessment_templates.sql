-- =============================================================
-- Assessment-Templates: God-verwaltete, auswählbare Checks.
-- Alle Templates teilen sich die 4 bestehenden Dimensionen
-- (datenqualitaet, prozessklarheit, kulturelle_akzeptanz,
-- governance_compliance) - nur die Fragen unterscheiden sich.
-- =============================================================

create table public.assessment_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  slug text not null unique,
  questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.assessment_templates is 'God-verwaltete Assessment-Checks, auswählbar auf der Startseite';
comment on column public.assessment_templates.questions is
  'Array aus { id, dimension, text }, dimension eine der 4 festen ASSESSMENT_DIMENSIONS';

-- set_updated_at() existiert bereits aus 0008 (change_requests).
create trigger assessment_templates_set_updated_at
  before update on public.assessment_templates
  for each row execute function public.set_updated_at();

alter table public.assessment_templates enable row level security;

create policy "Anyone can view active templates"
  on public.assessment_templates
  for select
  to anon, authenticated
  using (is_active = true);

create policy "God can manage all templates"
  on public.assessment_templates
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select on public.assessment_templates to anon, authenticated;
grant insert, update, delete on public.assessment_templates to authenticated;

-- =============================================================
-- assessments: Verknüpfung zum verwendeten Template + optionale
-- Unternehmensgröße (für spätere segmentierte Benchmarks vorbereitet,
-- der aktuelle Benchmark in Schritt 4 filtert noch nicht danach).
-- =============================================================
alter table public.assessments
  add column template_id uuid references public.assessment_templates (id) on delete set null,
  add column company_size_band text check (
    company_size_band in ('1-19', '20-49', '50-249', '250+')
  );

comment on column public.assessments.template_id is 'Verwendetes Assessment-Template. NULL für Einträge vor diesem Feature.';
comment on column public.assessments.company_size_band is 'Mitarbeiterzahl-Band, optional bei Einreichung angegeben';
