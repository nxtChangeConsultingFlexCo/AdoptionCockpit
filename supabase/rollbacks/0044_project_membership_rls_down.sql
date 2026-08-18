-- =============================================================
-- Rollback für supabase/migrations/0044_project_membership_rls.sql.
-- Kein Bestandteil der normalen Migrationskette (liegt bewusst außerhalb
-- von supabase/migrations) - bei Bedarf manuell ausführen, z.B.:
--   supabase db query --linked -f supabase/rollbacks/0044_project_membership_rls_down.sql
--
-- Setzt die Lese-Policies auf change_requests/roadmap_items/projects
-- exakt auf den Stand vor 0044 zurück (org-weit statt projekt-scoped)
-- und entfernt project_members + die neuen Helper/Trigger. Nach diesem
-- Rollback sehen wieder alle Org-Mitglieder alle Change Requests/
-- Roadmap-Einträge/Projekte ihrer Organisation - unabhängig von
-- Projekt-Mitgliedschaft (Stand nach 0043).
-- =============================================================

-- roadmap_items
alter policy "Client admins and CA board can manage roadmap items"
  on public.roadmap_items
  using (
    organization_id = public.current_user_org()
    and (
      public.current_user_has_org_role('client_admin')
      or public.current_user_has_org_role('ca_board')
    )
  )
  with check (
    organization_id = public.current_user_org()
    and (
      public.current_user_has_org_role('client_admin')
      or public.current_user_has_org_role('ca_board')
    )
  );

alter policy "Org members can view their organization's roadmap items"
  on public.roadmap_items
  using (organization_id = public.current_user_org());

-- change_requests
alter policy "Requesters can delete their own draft requests"
  on public.change_requests
  using (
    requested_by = auth.uid()
    and status = 'draft'
    and organization_id = public.current_user_org()
  );

alter policy "Requesters can edit their own draft requests"
  on public.change_requests
  using (
    requested_by = auth.uid()
    and organization_id = public.current_user_org()
  )
  with check (organization_id = public.current_user_org());

alter policy "Leaders can triage requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('leader')
  )
  with check (organization_id = public.current_user_org());

alter policy "IT board can update requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('it_board')
  )
  with check (organization_id = public.current_user_org());

alter policy "CA Board can update requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('ca_board')
  )
  with check (organization_id = public.current_user_org());

alter policy "Assigned leaders can update their requests"
  on public.change_requests
  using (
    assigned_leader = auth.uid()
    and organization_id = public.current_user_org()
  )
  with check (organization_id = public.current_user_org());

alter policy "Org members can create change requests"
  on public.change_requests
  with check (
    organization_id = public.current_user_org()
    and requested_by = auth.uid()
  );

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

alter policy "Leaders can view requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('leader')
  );

-- projects
alter policy "Org members can view their organization's projects"
  on public.projects
  using (organization_id = public.current_user_org());

-- project_members + Helper/Trigger
drop policy if exists "God can manage all project members" on public.project_members;
drop policy if exists "Client admins can manage members of their organization's projects" on public.project_members;
drop policy if exists "Members can view visible project's membership" on public.project_members;

drop function if exists public.current_user_can_access_project(uuid);

drop trigger if exists project_members_validate on public.project_members;
drop function if exists public.validate_project_member();

drop table if exists public.project_members;
