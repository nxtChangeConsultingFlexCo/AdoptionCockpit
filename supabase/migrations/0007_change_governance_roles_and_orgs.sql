-- =============================================================
-- Change-Governance-Grundlage: echte Organisationen + erweiterte
-- Berechtigungsrollen (employee, leader, cab_member, it_board,
-- steering_committee).
-- =============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null
);

comment on table public.organizations is 'Kundenunternehmen, das AdoptionCockpit nutzt';

alter table public.profiles
  add column organization_id uuid references public.organizations (id) on delete set null;

comment on column public.profiles.organization_id is
  'Zugehörige Organisation. NULL für plattformweite Rollen (god, consultant).';

-- Bestehenden Check-Constraint auf role dynamisch finden und ersetzen,
-- statt den generierten Namen zu erraten. Muss VOR dem Daten-Update
-- unten laufen, sonst verletzt "employee" noch den alten Constraint.
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%(role =%';

  if cname is not null then
    execute format('alter table public.profiles drop constraint %I', cname);
  end if;
end $$;

-- NOT VALID: neuer Constraint gilt sofort für künftige Schreibzugriffe,
-- bestehende Zeilen (u. a. noch 'client_user') werden erst nach dem
-- Daten-Update unten geprüft (VALIDATE CONSTRAINT).
alter table public.profiles
  add constraint profiles_role_check
  check (role in (
    'god', 'consultant', 'client_admin',
    'employee', 'leader', 'cab_member', 'it_board', 'steering_committee'
  )) not valid;

alter table public.profiles alter column role set default 'employee';

-- client_user -> employee (Namenskonflikt mit dem Governance-Rollenmodell
-- vermeiden, employee ist ab jetzt die einzige "normale Mitarbeiter"-Rolle).
update public.profiles set role = 'employee' where role = 'client_user';

alter table public.profiles validate constraint profiles_role_check;

-- Bestehende Profile ohne Organisation nach company_name gruppieren
-- (nachträgliches Backfill für Accounts von vor diesem Rollenmodell).
insert into public.organizations (name)
select distinct p.company_name
from public.profiles p
where p.organization_id is null
  and p.company_name is not null
  and not exists (
    select 1 from public.organizations o where o.name = p.company_name
  );

update public.profiles p
set organization_id = o.id
from public.organizations o
where p.organization_id is null
  and p.company_name = o.name;

-- ---------------------------------------------------------------
-- Security-Definer-Hilfsfunktionen für RLS-Policies. Direkte
-- Subqueries auf "profiles" innerhalb einer profiles-Policy können zu
-- "infinite recursion detected in policy"-Fehlern führen; über eine
-- security definer Funktion (umgeht RLS für den internen Lookup) wird
-- das sauber vermieden. Gleichzeitig zentraler, wiederverwendbarer
-- Baustein für alle künftigen rollenbasierten Policies.
-- ---------------------------------------------------------------
create function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.current_user_org()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------
-- Sicherheitslücke aus 0002 schließen: Die bestehende
-- "Users can update own profile"-Policy erlaubte es jedem Nutzer,
-- über einen direkten .update({ role: 'god' })-Aufruf sich selbst zu
-- befördern - "role" existierte zum Zeitpunkt dieser Policy (0002)
-- noch nicht, wurde aber nie nachgezogen, als die Spalte in 0004 dazu
-- kam. Ein Trigger verhindert jetzt Änderungen an role/organization_id
-- außer durch god oder client_admin (nur innerhalb der eigenen Org,
-- nie zu 'god').
-- ---------------------------------------------------------------
create function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     or new.organization_id is distinct from old.organization_id then
    if public.current_user_role() = 'god' then
      return new;
    elsif public.current_user_role() = 'client_admin'
      and old.organization_id = public.current_user_org()
      and new.organization_id = old.organization_id
      and new.role <> 'god'
    then
      return new;
    else
      raise exception 'Keine Berechtigung, Rolle oder Organisation zu ändern';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_role_change_trigger
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- ---------------------------------------------------------------
-- Erweiterte RLS-Policies für profiles (Organisationsmitglieder,
-- client_admin, god). Bestehende Policies aus 0002 bleiben erhalten.
-- ---------------------------------------------------------------
create policy "Organization members can view profiles in their organization"
  on public.profiles
  for select
  to authenticated
  using (
    organization_id is not null
    and organization_id = public.current_user_org()
  );

create policy "God can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_role() = 'god');

create policy "Client admins can update profiles in their organization"
  on public.profiles
  for update
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_role() = 'client_admin'
  )
  with check (organization_id = public.current_user_org());

create policy "God can update any profile"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_role() = 'god')
  with check (true);

-- ---------------------------------------------------------------
-- organizations: RLS + Grants
-- ---------------------------------------------------------------
alter table public.organizations enable row level security;

create policy "Members can view their own organization"
  on public.organizations
  for select
  to authenticated
  using (id = public.current_user_org());

create policy "God can view all organizations"
  on public.organizations
  for select
  to authenticated
  using (public.current_user_role() = 'god');

grant usage on schema public to authenticated;
grant select on public.organizations to authenticated;

-- ---------------------------------------------------------------
-- Registrierung erstellt ab jetzt automatisch eine neue Organisation
-- und macht den registrierenden Nutzer zu deren client_admin (siehe
-- Chat-Entscheidung: "1 Org pro Registrierung"). Ein Einladungs-Flow
-- für weitere Mitarbeiter derselben Firma folgt in einem späteren
-- Schritt - bis dahin werden weitere Team-Mitglieder von einem
-- client_admin/god manuell in dieselbe Organisation verschoben.
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if new.raw_user_meta_data ->> 'company_name' is not null then
    insert into public.organizations (name)
    values (new.raw_user_meta_data ->> 'company_name')
    returning id into new_org_id;
  end if;

  insert into public.profiles (
    id, first_name, last_name, company_name, job_title,
    gdpr_consent, marketing_consent, organization_id, role
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'job_title',
    coalesce((new.raw_user_meta_data ->> 'gdpr_consent')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    new_org_id,
    case when new_org_id is not null then 'client_admin' else 'employee' end
  );
  return new;
end;
$$;
