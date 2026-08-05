-- Profile pro registriertem Nutzer (1:1 zu auth.users).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  first_name text,
  last_name text,
  company_name text,
  role text,
  gdpr_consent boolean not null default false,
  marketing_consent boolean not null default false
);

comment on table public.profiles is 'Stammdaten registrierter Nutzer, 1:1 zu auth.users';

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Legt bei Registrierung automatisch ein Profil an, befuellt aus den
-- Metadaten, die signUp(options.data) mitgibt (first_name, last_name,
-- company_name, role).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, first_name, last_name, company_name, role,
    gdpr_consent, marketing_consent
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'role',
    coalesce((new.raw_user_meta_data ->> 'gdpr_consent')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Erweiterung der assessments-Tabelle um Kontakt-/Consent-Pflichtfelder
-- und optionale Verknuepfung zu einem registrierten Nutzer.
alter table public.assessments
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists role text,
  add column if not exists gdpr_consent boolean not null default false,
  add column if not exists marketing_consent boolean not null default false;

comment on column public.assessments.user_id is 'Gesetzt, wenn das Assessment von einem eingeloggten Nutzer stammt';
comment on column public.assessments.gdpr_consent is 'Pflicht-Einwilligung zur Datenverarbeitung (DSGVO)';
comment on column public.assessments.marketing_consent is 'Optionale Einwilligung zu Marketing-Kontakt';

alter table public.assessments
  add constraint assessments_completed_requires_gdpr_consent
  check (status <> 'completed' or gdpr_consent = true);

-- Ergaenzt die bisherige anon-Insert-Policy um authentifizierte Nutzer und
-- erzwingt, dass eingeloggte Nutzer nur mit ihrer eigenen user_id
-- (oder ohne user_id) einfuegen koennen.
create policy "Authenticated users can insert their own assessment"
  on public.assessments
  for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "Users can view own assessments"
  on public.assessments
  for select
  to authenticated
  using (user_id = auth.uid());
