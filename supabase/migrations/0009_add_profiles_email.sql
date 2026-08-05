-- Für die Benutzerverwaltung (Rollen zuweisen) muss ein Admin erkennen
-- können, WER ein Profil ist. auth.users.email ist für den authenticated-
-- Client nicht direkt abfragbar (geschütztes Schema), daher hier als
-- Kopie geführt - analog zu first_name/last_name, die ebenfalls schon aus
-- den signUp()-Metadaten stammen statt live aus auth.users gelesen zu
-- werden. Kein automatischer Sync bei späterer E-Mail-Änderung (kein
-- E-Mail-Änderungs-Flow existiert aktuell).
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

comment on column public.profiles.email is
  'Kopie aus auth.users.email zum Zeitpunkt der Registrierung, für Anzeige in Benutzerverwaltung/Change-Requests.';

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
    id, first_name, last_name, company_name, job_title, email,
    gdpr_consent, marketing_consent, organization_id, role
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'job_title',
    new.email,
    coalesce((new.raw_user_meta_data ->> 'gdpr_consent')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    new_org_id,
    case when new_org_id is not null then 'client_admin' else 'employee' end
  );
  return new;
end;
$$;
