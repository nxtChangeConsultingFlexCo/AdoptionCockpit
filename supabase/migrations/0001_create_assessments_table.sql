create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text,
  email text,
  answers jsonb not null default '{}'::jsonb,
  scores jsonb,
  total_score integer,
  status text not null default 'draft' check (status in ('draft', 'completed'))
);

comment on table public.assessments is 'KI-Readiness-Assessment Einreichungen';
comment on column public.assessments.answers is 'Rohantworten des Assessments (Frage-ID -> Antwort)';
comment on column public.assessments.scores is 'Scores je Dimension: datenqualitaet, prozessklarheit, kulturelle_akzeptanz, governance_compliance';

alter table public.assessments enable row level security;

-- Erlaubt anonymes Anlegen von Assessments (z.B. eingebettet auf der Website).
create policy "Anyone can insert an assessment"
  on public.assessments
  for insert
  to anon
  with check (true);

-- Kein öffentliches Lesen/Aktualisieren via anon key. Zugriff für Auswertung
-- erfolgt über den service_role key (server-seitig) oder eine spätere
-- authentifizierte Policy.
