-- "role" hieß bisher die frei eingegebene Funktion/Job-Titel (z. B.
-- "IT-Leitung"), abgefragt bei Registrierung/Kontaktformular. Das kollidiert
-- mit dem neuen Berechtigungsrollen-Konzept. Umbenennung zu job_title, bevor
-- "role" für RBAC neu belegt wird.
alter table public.profiles rename column role to job_title;
alter table public.assessments rename column role to job_title;

-- Berechtigungsrolle je Nutzer. Wird ausschließlich serverseitig gesetzt
-- (z. B. durch den "god"-Admin-Bereich, künftig) - niemals aus öffentlichen
-- Formularen wie der Registrierung befüllt, um Privilege Escalation zu
-- verhindern.
alter table public.profiles
  add column role text not null default 'client_user'
  check (role in ('god', 'consultant', 'client_admin', 'client_user'));

comment on column public.profiles.role is 'Berechtigungsrolle: god (Platform-Owner), consultant, client_admin, client_user';
comment on column public.profiles.job_title is 'Frei eingegebene Funktion/Position im Unternehmen (z. B. "IT-Leitung")';
comment on column public.assessments.job_title is 'Frei eingegebene Funktion/Position im Unternehmen (z. B. "IT-Leitung")';

-- handle_new_user() (aus 0002) verweist auf die jetzt umbenannte Spalte und
-- muss neu definiert werden. "role" (RBAC) wird bewusst NICHT aus den
-- signUp()-Metadaten übernommen, sondern bleibt beim Default 'client_user' -
-- die Berechtigungsrolle darf nicht über ein öffentliches Formular gesetzt
-- werden können.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, first_name, last_name, company_name, job_title,
    gdpr_consent, marketing_consent
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'job_title',
    coalesce((new.raw_user_meta_data ->> 'gdpr_consent')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false)
  );
  return new;
end;
$$;
