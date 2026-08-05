-- =============================================================
-- Bugfix: client_admin konnte einen bestehenden god/consultant-User
-- (der zufällig derselben Organisation angehört) sehen UND dessen
-- Rolle herabstufen. Der Trigger aus 0007 prüfte nur new.role <> 'god'
-- (keine Eskalation ZU god), nicht old.role <> 'god' (keine Änderung
-- AN einem bestehenden god/consultant). Zusätzlich: god ist konzeptionell
-- organisationsunabhängig (organization_id NULL) - der Bootstrap-User
-- hatte noch die alte, historische Zuordnung aus der Zeit vor dem
-- Rollenmodell.
-- =============================================================

-- Der bestehende Trigger würde diese Korrektur selbst blockieren (er
-- kennt außerhalb eines authentifizierten "god"-Requests keinen
-- current_user_role()) - hier gezielt und nur für diese eine Anweisung
-- deaktiviert.
alter table public.profiles disable trigger guard_profile_role_change_trigger;

update public.profiles
set organization_id = null
where role in ('god', 'consultant');

alter table public.profiles enable trigger guard_profile_role_change_trigger;

create or replace function public.guard_profile_role_change()
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
    elsif old.role not in ('god', 'consultant')
      and public.current_user_role() = 'client_admin'
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

-- =============================================================
-- Einladungen: client_admin darf jetzt für die eigene Organisation
-- einladen (bisher nur god). Ergänzt die bestehende god-Policy, ersetzt
-- sie nicht.
-- =============================================================
create policy "Client admins can manage invitations in their organization"
  on public.invitations
  for all
  to authenticated
  using (
    public.current_user_role() = 'client_admin'
    and organization_id = public.current_user_org()
  )
  with check (
    public.current_user_role() = 'client_admin'
    and organization_id = public.current_user_org()
  );
