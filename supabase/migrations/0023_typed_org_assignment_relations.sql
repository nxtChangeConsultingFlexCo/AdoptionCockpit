-- Erweitert relation_type um die konkreten Hierarchie-Stufen, damit
-- Client Admin Zuordnungen typisiert anlegen kann (statt nur dem
-- generischen 'reports_to', das weiterhin für die Self-Service-
-- Zuordnung in /settings/team genutzt wird). Benennung: {parent}_{child}
-- entlang der Kette employee -> leader -> ca_board -> steering_committee
-- -> it_board.
alter table public.org_assignments
  drop constraint if exists org_assignments_relation_type_check;

alter table public.org_assignments
  add constraint org_assignments_relation_type_check
  check (relation_type in (
    'reports_to',
    'leader_employee',
    'ca_board_leader',
    'steering_ca_board',
    'it_board_steering'
  ));
