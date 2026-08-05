-- =============================================================
-- Zuordnungs-Modell klar getrennt: "Team" (operative Berichtskette,
-- Employee -> Leader, org_assignments) vs. "Gremien" (CA Board/IT
-- Board/Steering Committee = flache, mehrfach mögliche Mitgliedschaft,
-- bereits über profile_roles abgebildet - keine Parent-Kette).
--
-- org_assignments hat pro child_user_id genau eine Zeile (PK) und ist
-- damit strukturell ungeeignet, um "Mitglied in mehreren Gremien
-- gleichzeitig" abzubilden - das gehört weiterhin zu profile_roles
-- (dort schon immer mehrfach kombinierbar, siehe 0016). Die
-- ehemaligen "ca_board_leader"/"it_board_ca_board"-Kettenglieder
-- (Board als operativer Parent) werden deshalb retiriert; Board-
-- Sichtbarkeit kommt stattdessen direkt aus der Gremien-Mitgliedschaft
-- (siehe Policies unten), analog zu steering_committee (0030).
-- =============================================================
delete from public.org_assignments
where relation_type in ('ca_board_leader', 'it_board_ca_board');

alter table public.org_assignments
  drop constraint if exists org_assignments_relation_type_check;

alter table public.org_assignments
  add constraint org_assignments_relation_type_check
  check (relation_type in ('reports_to', 'leader_employee'));

-- Gremien-Sicht: CA Board und IT Board sehen Assessment-Ergebnisse
-- org-weit (wie client_admin/steering_committee), unabhängig von
-- einer Team-Zuordnung - ihre Aufsicht kommt aus der Mitgliedschaft,
-- nicht aus einer Position in der Berichtskette.
create policy "CA board can view assessments in their organization"
  on public.assessments
  for select
  to authenticated
  using (
    user_id is not null
    and public.current_user_has_org_role('ca_board')
    and exists (
      select 1 from public.profiles p
      where p.id = assessments.user_id
        and p.organization_id = public.current_user_org()
    )
  );

create policy "IT board can view assessments in their organization"
  on public.assessments
  for select
  to authenticated
  using (
    user_id is not null
    and public.current_user_has_org_role('it_board')
    and exists (
      select 1 from public.profiles p
      where p.id = assessments.user_id
        and p.organization_id = public.current_user_org()
    )
  );
