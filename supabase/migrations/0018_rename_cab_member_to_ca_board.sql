-- Wording: "CAB-Mitglied" / cab_member -> "CA Board" / ca_board
-- (durchgängig in UI, Navigation, Texten). NOT VALID + Daten-Update +
-- VALIDATE, damit bestehende Zeilen den neuen Constraint nicht sofort
-- verletzen (siehe client_user->employee-Migration für das Muster).

alter table public.profiles disable trigger guard_profile_role_change_trigger;

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in (
    'god', 'consultant', 'client_admin',
    'employee', 'leader', 'ca_board', 'it_board', 'steering_committee'
  )) not valid;
update public.profiles set role = 'ca_board' where role = 'cab_member';
alter table public.profiles validate constraint profiles_role_check;

alter table public.profiles enable trigger guard_profile_role_change_trigger;

alter table public.profile_roles drop constraint profile_roles_role_check;
alter table public.profile_roles add constraint profile_roles_role_check
  check (role in (
    'client_admin', 'employee', 'leader', 'ca_board', 'it_board', 'steering_committee'
  )) not valid;
update public.profile_roles set role = 'ca_board' where role = 'cab_member';
alter table public.profile_roles validate constraint profile_roles_role_check;

alter table public.invitations drop constraint invitations_role_check;
alter table public.invitations add constraint invitations_role_check
  check (role in (
    'client_admin', 'employee', 'leader', 'ca_board', 'it_board', 'steering_committee'
  )) not valid;
update public.invitations set role = 'ca_board' where role = 'cab_member';
alter table public.invitations validate constraint invitations_role_check;

-- RLS-Policies, die die Rolle als Literal referenzieren.
alter policy "Org members can view relevant change requests"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and (
      public.current_user_has_org_role('client_admin')
      or public.current_user_has_org_role('ca_board')
      or public.current_user_has_org_role('it_board')
      or public.current_user_has_org_role('steering_committee')
      or requested_by = auth.uid()
      or assigned_leader = auth.uid()
    )
  );

alter policy "CAB members can update requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('ca_board')
  )
  with check (organization_id = public.current_user_org());

alter policy "CAB members can update requests in their organization"
  on public.change_requests
  rename to "CA Board can update requests in their organization";
