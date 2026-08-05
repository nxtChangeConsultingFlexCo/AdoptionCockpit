-- =============================================================
-- Multi-Rollen: employee/leader/cab_member/it_board/
-- steering_committee/client_admin werden mehrfach kombinierbar
-- (Chat-Entscheidung). god und consultant bleiben einzelne,
-- exklusive Plattformrollen und liegen weiterhin in profiles.role.
-- =============================================================

create table public.profile_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in (
    'client_admin', 'employee', 'leader', 'cab_member', 'it_board', 'steering_committee'
  )),
  created_at timestamptz not null default now(),
  primary key (profile_id, role)
);

comment on table public.profile_roles is
  'Mehrfach zuweisbare Org-/Change-Governance-Rollen. god und consultant sind ausgenommen (bleiben in profiles.role).';

-- Bestehende Rolle je Profil (außer god/consultant) übernehmen.
insert into public.profile_roles (profile_id, role)
select id, role from public.profiles
where role not in ('god', 'consultant');

alter table public.profile_roles enable row level security;

create function public.current_user_has_org_role(p_role text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profile_roles
    where profile_id = auth.uid() and role = p_role
  );
$$;

create policy "Users can view their own roles"
  on public.profile_roles
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy "Organization members can view roles in their organization"
  on public.profile_roles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_roles.profile_id
        and p.organization_id is not null
        and p.organization_id = public.current_user_org()
    )
  );

create policy "God can view all profile roles"
  on public.profile_roles
  for select
  to authenticated
  using (public.current_user_role() = 'god');

create policy "God can manage all profile roles"
  on public.profile_roles
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

create policy "Client admins can manage roles in their organization"
  on public.profile_roles
  for all
  to authenticated
  using (
    public.current_user_has_org_role('client_admin')
    and exists (
      select 1 from public.profiles target
      where target.id = profile_roles.profile_id
        and target.organization_id = public.current_user_org()
    )
  )
  with check (
    public.current_user_has_org_role('client_admin')
    and exists (
      select 1 from public.profiles target
      where target.id = profile_roles.profile_id
        and target.organization_id = public.current_user_org()
    )
  );

grant select, insert, delete on public.profile_roles to authenticated;

-- ---------------------------------------------------------------
-- Bestehende RLS-Policies auf Rollen-Gleichheit (current_user_role() =
-- 'client_admin'/'cab_member'/'it_board'/'leader') umstellen auf
-- current_user_has_org_role(), damit mehrere Rollen gleichzeitig
-- greifen. god-Policies bleiben unverändert.
-- ---------------------------------------------------------------
alter policy "CAB members can update requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('cab_member')
  )
  with check (organization_id = public.current_user_org());

alter policy "Client admins and god can update any request in scope"
  on public.change_requests
  using (
    (organization_id = public.current_user_org() and public.current_user_has_org_role('client_admin'))
    or public.current_user_role() = 'god'
  )
  with check (true);

alter policy "IT board can update requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('it_board')
  )
  with check (organization_id = public.current_user_org());

alter policy "Leaders can triage requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('leader')
  )
  with check (organization_id = public.current_user_org());

alter policy "Leaders can view requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('leader')
  );

alter policy "Org members can view relevant change requests"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and (
      public.current_user_has_org_role('client_admin')
      or public.current_user_has_org_role('cab_member')
      or public.current_user_has_org_role('it_board')
      or public.current_user_has_org_role('steering_committee')
      or requested_by = auth.uid()
      or assigned_leader = auth.uid()
    )
  );

alter policy "Client admins can manage invitations in their organization"
  on public.invitations
  using (
    public.current_user_has_org_role('client_admin')
    and organization_id = public.current_user_org()
  )
  with check (
    public.current_user_has_org_role('client_admin')
    and organization_id = public.current_user_org()
  );

alter policy "Client admins can update profiles in their organization"
  on public.profiles
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('client_admin')
  )
  with check (organization_id = public.current_user_org());

-- ---------------------------------------------------------------
-- guard_profile_role_change vereinfacht: client_admin lebt nicht mehr
-- in profiles.role, daher braucht nur noch god Sonderrechte auf
-- profiles.role/organization_id.
-- ---------------------------------------------------------------
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
    else
      raise exception 'Keine Berechtigung, Rolle oder Organisation zu ändern';
    end if;
  end if;
  return new;
end;
$$;

-- Bestehende profiles.role-Werte (außer god/consultant) auf das
-- vestigiale 'employee' normalisieren - maßgeblich sind ab jetzt die
-- Zeilen in profile_roles (oben bereits befüllt).
alter table public.profiles disable trigger guard_profile_role_change_trigger;
update public.profiles set role = 'employee' where role not in ('god', 'consultant');
alter table public.profiles enable trigger guard_profile_role_change_trigger;

-- ---------------------------------------------------------------
-- Registrierung: die aufgelöste Org-Rolle landet jetzt in
-- profile_roles statt in profiles.role (das bleibt 'employee').
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  invite_token_raw text;
  invite_token uuid;
  matched_invitation public.invitations%rowtype;
  resolved_org_id uuid;
  resolved_org_role text;
begin
  invite_token_raw := new.raw_user_meta_data ->> 'invite_token';

  if invite_token_raw is not null and invite_token_raw <> '' then
    begin
      invite_token := invite_token_raw::uuid;
    exception when others then
      invite_token := null;
    end;
  end if;

  if invite_token is not null then
    select * into matched_invitation
    from public.invitations
    where token = invite_token
      and status = 'pending'
      and lower(email) = lower(new.email)
    limit 1;
  end if;

  if matched_invitation.id is not null then
    resolved_org_id := matched_invitation.organization_id;
    resolved_org_role := matched_invitation.role;

    update public.invitations
    set status = 'accepted', accepted_at = now()
    where id = matched_invitation.id;
  else
    if new.raw_user_meta_data ->> 'company_name' is not null then
      insert into public.organizations (name)
      values (new.raw_user_meta_data ->> 'company_name')
      returning id into new_org_id;
    end if;
    resolved_org_id := new_org_id;
    resolved_org_role := case when new_org_id is not null then 'client_admin' else 'employee' end;
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
    resolved_org_id,
    'employee'
  );

  insert into public.profile_roles (profile_id, role)
  values (new.id, resolved_org_role)
  on conflict do nothing;

  return new;
end;
$$;
