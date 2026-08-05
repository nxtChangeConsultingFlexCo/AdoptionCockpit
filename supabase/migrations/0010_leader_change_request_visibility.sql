-- Lücke aus 0008: Cluster Leads konnten nur Anfragen sehen/bearbeiten,
-- die ihnen BEREITS zugewiesen waren (assigned_leader = auth.uid()).
-- Neu eingereichte Anfragen haben aber noch keinen zugewiesenen Leader -
-- ein Leader müsste sie erst sehen können, um sie übernehmen und an das
-- CAB weiterleiten zu können. Analog zu den anderen Board-Rollen
-- (client_admin, cab_member, it_board, steering_committee) bekommt
-- "leader" jetzt organisationsweite Sicht- und Bearbeitungsrechte.
create policy "Leaders can view requests in their organization"
  on public.change_requests
  for select
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_role() = 'leader'
  );

create policy "Leaders can triage requests in their organization"
  on public.change_requests
  for update
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_role() = 'leader'
  )
  with check (organization_id = public.current_user_org());
