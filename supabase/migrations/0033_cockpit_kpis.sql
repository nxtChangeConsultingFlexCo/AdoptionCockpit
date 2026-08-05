-- =============================================================
-- Freischaltbare Cockpit-KPI-Kacheln: client_admin legt pro Rolle
-- fest, welche KPIs im Cockpit sichtbar sind. Gespeichert als jsonb
-- auf organizations ({ "<role>": ["<kpi_id>", ...] }), fehlende Rollen
-- fallen im Code auf ein schlankes Standard-Set zurück.
-- =============================================================
alter table public.organizations
  add column cockpit_kpi_visibility jsonb not null default '{}'::jsonb;

comment on column public.organizations.cockpit_kpi_visibility is
  'Pro Rolle (employee/leader/ca_board/it_board/steering_committee) die Liste sichtbarer Cockpit-KPI-IDs. Fehlt eine Rolle, gilt der Code-Default. client_admin/god sehen immer alle KPIs, unabhängig davon.';

-- Kein generisches UPDATE-Grant auf organizations für client_admin
-- (das würde auch is_blocked einschließen, das bewusst god-only bleibt
-- - siehe 0027). Stattdessen eine schmale, zweckgebundene
-- SECURITY-DEFINER-Funktion, die ausschließlich diese eine Spalte und
-- ausschließlich die eigene Organisation anfasst.
create function public.set_cockpit_kpi_visibility(
  p_organization_id uuid,
  p_role text,
  p_kpi_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('employee', 'leader', 'ca_board', 'it_board', 'steering_committee') then
    raise exception 'Ungültige Rolle für Cockpit-KPI-Konfiguration';
  end if;

  if not (
    public.current_user_role() = 'god'
    or (
      public.current_user_has_org_role('client_admin')
      and p_organization_id = public.current_user_org()
    )
  ) then
    raise exception 'Keine Berechtigung, die Cockpit-KPIs dieser Organisation zu ändern';
  end if;

  update public.organizations
  set cockpit_kpi_visibility = jsonb_set(
    coalesce(cockpit_kpi_visibility, '{}'::jsonb),
    array[p_role],
    to_jsonb(p_kpi_ids),
    true
  )
  where id = p_organization_id;
end;
$$;

grant execute on function public.set_cockpit_kpi_visibility(uuid, text, text[]) to authenticated;
