-- =============================================================
-- Strukturelles Rückgrat: Organisation -> Programm -> Projekt.
-- programs ist eine optionale Klammer ohne eigene operative Artefakte
-- (aggregiert nur Projekte); projects ist der operative Container, an
-- dem Change Requests und Roadmap-Einträge künftig hängen, statt
-- direkt an der Organisation. Ein Projekt kann ohne Programm
-- existieren (program_id nullable).
-- =============================================================

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  goal text,
  status text not null default 'active' check (status in ('active', 'paused', 'done', 'archived')),
  start_date date,
  target_date date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.programs is
  'Optionale Klammer über mehreren Projekten einer Organisation. Besitzt selbst keine operativen Artefakte (Change Requests, Roadmap) - die hängen an projects.';

create trigger programs_set_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

alter table public.programs enable row level security;

create policy "Org members can view their organization's programs"
  on public.programs
  for select
  to authenticated
  using (organization_id = public.current_user_org());

create policy "God can view all programs"
  on public.programs
  for select
  to authenticated
  using (public.current_user_role() = 'god');

create policy "Client admins can manage programs in their organization"
  on public.programs
  for all
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('client_admin')
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('client_admin')
  );

create policy "God can manage all programs"
  on public.programs
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select, insert, update, delete on public.programs to authenticated;

-- ---------------------------------------------------------------
-- projects: operativer Container. organization_id wird bewusst
-- denormalisiert mitgeführt (statt nur über program_id ableitbar),
-- damit ein Projekt auch ohne Programm eindeutig einer Organisation
-- zugeordnet ist und abhängige RLS/Queries direkt auf
-- projects.organization_id joinen können, ohne über programs zu gehen.
-- ---------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  name text not null,
  goal text,
  status text not null default 'planned' check (status in ('planned', 'active', 'on_hold', 'done', 'cancelled')),
  phase text,
  start_date date,
  target_date date,
  lead uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.projects is
  'Operativer Container einer Organisation, optional einem Programm zugeordnet. Change Requests und Roadmap-Einträge hängen ab hier an project_id statt direkt an organization_id.';
comment on column public.projects.lead is 'Projektverantwortliche/r (profiles.id), optional.';

-- Bewusst KEINE Lifecycle-/Lizenz-/Billing-Felder in diesem Schnitt -
-- status/phase decken den aktuellen Bedarf ab; weitere Spalten (z.B.
-- Lifecycle-Status, Lizenzmodell) sind später additiv ergänzbar, ohne
-- diese Tabelle umzubauen.

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "Org members can view their organization's projects"
  on public.projects
  for select
  to authenticated
  using (organization_id = public.current_user_org());

create policy "God can view all projects"
  on public.projects
  for select
  to authenticated
  using (public.current_user_role() = 'god');

create policy "Client admins can manage projects in their organization"
  on public.projects
  for all
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('client_admin')
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('client_admin')
  );

create policy "God can manage all projects"
  on public.projects
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select, insert, update, delete on public.projects to authenticated;

-- =============================================================
-- Retrofit: change_requests und roadmap_items bekommen project_id.
-- Verlustfrei - pro bestehender Organisation wird genau ein
-- Default-Projekt angelegt (name = Org-Name) und alle vorhandenen
-- Zeilen zugeordnet, bevor project_id NOT NULL wird. Jede Bestands-Org
-- läuft danach bruchlos als Ein-Projekt-Org weiter, Kanban/Historie/
-- Roadmap bleiben intakt.
-- =============================================================
alter table public.change_requests
  add column project_id uuid references public.projects (id) on delete cascade;
alter table public.roadmap_items
  add column project_id uuid references public.projects (id) on delete cascade;

insert into public.projects (organization_id, name, status)
select o.id, o.name, 'active'
from public.organizations o;

update public.change_requests cr
set project_id = p.id
from public.projects p
where p.organization_id = cr.organization_id
  and cr.project_id is null;

update public.roadmap_items ri
set project_id = p.id
from public.projects p
where p.organization_id = ri.organization_id
  and ri.project_id is null;

alter table public.change_requests alter column project_id set not null;
alter table public.roadmap_items alter column project_id set not null;

comment on column public.change_requests.project_id is
  'Projekt, dem diese Anfrage zugeordnet ist. Bestandszeilen wurden auf das automatisch angelegte Default-Projekt ihrer Organisation gebackfillt.';
comment on column public.roadmap_items.project_id is
  'Projekt, dem dieser Roadmap-Eintrag zugeordnet ist. Bestandszeilen wurden auf das automatisch angelegte Default-Projekt ihrer Organisation gebackfillt.';

-- Bestehende RLS-Policies auf change_requests/roadmap_items bleiben
-- unverändert: Org-Isolation läuft weiterhin über organization_id
-- (dort bereits vorhanden und ausreichend). project_id ist zusätzliche
-- Scoping-Information für die Anwendung (Projekt-Umschalter), keine
-- neue Sicherheitsgrenze - deshalb kein Policy-Umbau nötig.

-- TODO(Projekt-Backbone, Folge-Schnitt): Assessment-Ergebnisse
-- (public.assessments) sind aktuell nur user_id + company_name(text)
-- -basiert, nicht über eine organization_id-FK an eine Organisation
-- angebunden (siehe 0001/0020), und es gibt keine separate
-- Ergebnis-Tabelle je Organisation/Projekt. Damit ist nicht eindeutig
-- bestimmbar, welche Zeile bei mehreren Projekten je Org gemeint wäre
-- - deshalb bewusst KEIN assessments.project_id in diesem Schnitt.
-- Vor dem Nachziehen im PR klären: pro Projekt eigene Assessment-
-- Zuordnung, oder bleibt der Check org-/personenweit?
