-- =============================================================
-- Steering Committee aus dem operativen Change-Flow nehmen: die
-- Kette ist jetzt employee -> leader -> ca_board -> it_board (ohne
-- Zwischenstufe). Steering bleibt als Rolle bestehen, aber als
-- Aufsicht/Reporting statt als Pflicht-Station:
--   - keine Queue-Bearbeitung (galt schon vorher: es gab nie eine
--     UPDATE-Policy oder UI-Aktion für steering_committee auf
--     change_requests)
--   - stattdessen org-weite Lesesicht auf Assessment-Ergebnisse, analog
--     zu client_admin, für Fortschritts-/Reporting-Zwecke
-- =============================================================

-- Alte Steering-Zuordnungen entfernen (aktuell keine vorhanden, aber
-- falls doch: sie beschreiben eine Kettenstufe, die es nicht mehr
-- gibt).
delete from public.org_assignments
where relation_type in ('steering_ca_board', 'it_board_steering');

alter table public.org_assignments
  drop constraint if exists org_assignments_relation_type_check;

alter table public.org_assignments
  add constraint org_assignments_relation_type_check
  check (relation_type in (
    'reports_to',
    'leader_employee',
    'ca_board_leader',
    'it_board_ca_board'
  ));

-- Aufsicht/Reporting: steering_committee sieht Assessment-Ergebnisse
-- org-weit (wie client_admin), unabhängig von der org_assignments-
-- Hierarchie - keine Schreibrechte, nur SELECT.
create policy "Steering committee can view assessments in their organization"
  on public.assessments
  for select
  to authenticated
  using (
    user_id is not null
    and public.current_user_has_org_role('steering_committee')
    and exists (
      select 1 from public.profiles p
      where p.id = assessments.user_id
        and p.organization_id = public.current_user_org()
    )
  );
