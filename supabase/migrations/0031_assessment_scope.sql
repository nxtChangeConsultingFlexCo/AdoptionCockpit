-- =============================================================
-- Feinere Check-Freigabe: bisher war organization_assessments nur ein
-- Org-weiter An/Aus-Schalter (is_available). Jetzt kann client_admin
-- zusätzlich auf bestimmte Rollen oder einzelne Personen einschränken.
-- =============================================================
alter table public.organization_assessments
  add column scope_type text not null default 'org' check (scope_type in ('org', 'roles', 'users')),
  add column role_list text[] not null default '{}'::text[],
  add column user_ids uuid[] not null default '{}'::uuid[];

comment on column public.organization_assessments.scope_type is
  'org = ganze Organisation, roles = nur role_list, users = nur user_ids.';
comment on column public.organization_assessments.role_list is
  'Genutzt wenn scope_type = roles: Liste von profile_roles.role-Werten.';
comment on column public.organization_assessments.user_ids is
  'Genutzt wenn scope_type = users: Liste von profiles.id.';

-- Sichtbarkeit für normale Org-Mitglieder jetzt scope-abhängig statt
-- pauschal org-weit. client_admin/god verwalten weiterhin über ihre
-- eigenen, davon unabhängigen FOR ALL-Policies (siehe 0020) - für sie
-- ändert sich nichts.
alter policy "Org members can view templates freigegeben for their org"
  on public.assessment_templates
  using (
    is_active = true
    and exists (
      select 1 from public.organization_assessments oa
      where oa.template_id = assessment_templates.id
        and oa.organization_id = public.current_user_org()
        and oa.is_available = true
        and (
          oa.scope_type = 'org'
          or (
            oa.scope_type = 'roles'
            and exists (
              select 1 from public.profile_roles pr
              where pr.profile_id = auth.uid() and pr.role = any(oa.role_list)
            )
          )
          or (oa.scope_type = 'users' and auth.uid() = any(oa.user_ids))
        )
    )
  );
