-- =============================================================
-- Change Agent: neue, mehrfach zuweisbare Org-Rolle für informelle
-- Multiplikator:innen ("Key User"), die in mehreren Handlungsempfehlungen
-- der Assessments bereits erwähnt werden, aber bislang nirgends im
-- Rollenmodell abgebildet waren. Bewusst ohne eigene Berechtigungen -
-- rein deskriptiv/zur Auffindbarkeit über die bestehende Rollen-
-- verwaltung und den Rollen-Filter auf /admin/users.
-- =============================================================
alter table public.profile_roles
  drop constraint if exists profile_roles_role_check;

alter table public.profile_roles
  add constraint profile_roles_role_check
  check (role in (
    'client_admin', 'employee', 'leader', 'ca_board', 'it_board',
    'steering_committee', 'change_agent'
  ));

comment on column public.profile_roles.role is
  'Mehrfach zuweisbare Org-/Change-Governance-Rolle. change_agent ist rein deskriptiv (keine eigenen Berechtigungen).';
