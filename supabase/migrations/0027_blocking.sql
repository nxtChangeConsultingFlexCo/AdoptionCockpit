-- =============================================================
-- Sperren (Blockieren): god sperrt global (Nutzer + Organisationen),
-- client_admin sperrt nur Nutzer der eigenen Organisation. Login prüft
-- beides (siehe getCurrentUser()/login-action) und meldet gesperrte
-- Sessions sofort ab.
-- =============================================================
alter table public.profiles
  add column is_blocked boolean not null default false,
  add column blocked_at timestamptz,
  add column blocked_reason text;

comment on column public.profiles.is_blocked is
  'Gesperrt durch god (global) oder client_admin (eigene Org). Gesperrte Accounts werden beim Login/serverseitig abgemeldet.';

alter table public.organizations
  add column is_blocked boolean not null default false;

comment on column public.organizations.is_blocked is
  'Gesperrt durch god. Alle Mitglieder werden beim Login/serverseitig abgemeldet.';

-- Bisher gab es nur SELECT-Policies auf organizations - god braucht
-- jetzt Schreibzugriff, um is_blocked zu setzen.
create policy "God can update any organization"
  on public.organizations
  for update
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

-- Niemand darf sich selbst sperren (god eingeschlossen) - verhindert
-- versehentliches oder böswilliges Aussperren des eigenen Accounts.
-- Greift unabhängig davon, wer schreibt (god oder client_admin).
create function public.guard_self_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_blocked = true and old.is_blocked = false and old.id = auth.uid() then
    raise exception 'Du kannst dich nicht selbst sperren';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_self_block
  before update on public.profiles
  for each row execute function public.guard_self_block();
