-- =============================================================
-- Zuordnungsmodell: wer berichtet an wen (employee -> leader ->
-- ca_board -> steering_committee -> it_board -> client_admin -> god).
-- Steuert die hierarchische Sicht auf individuelle Assessment-
-- Ergebnisse: ein Vorgesetzter sieht nur die Ergebnisse seines
-- eigenen Teilbaums, nicht automatisch die ganze Organisation.
-- Change Requests/Roadmap bleiben unverändert org-weit sichtbar für
-- client_admin/ca_board/it_board/steering_committee/leader (siehe
-- 0016) - diese Migration betrifft ausschließlich assessments.
-- =============================================================
create table public.org_assignments (
  child_user_id uuid primary key references public.profiles (id) on delete cascade,
  parent_user_id uuid not null references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  relation_type text not null default 'reports_to' check (relation_type in ('reports_to')),
  created_at timestamptz not null default now(),
  check (child_user_id <> parent_user_id)
);

comment on table public.org_assignments is
  'Direkte Berichtslinie (child reports_to parent). Ein child hat höchstens einen parent (strikter Baum). Steuert die hierarchische Assessment-Sicht.';

-- Validierung: beide Profile müssen zur angegebenen Organisation
-- gehören, und die Zuordnung darf keinen Zyklus erzeugen (parent darf
-- nicht bereits ein Nachfahre von child sein).
create function public.validate_org_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  child_org uuid;
  parent_org uuid;
  cycle_found boolean;
begin
  select organization_id into child_org from public.profiles where id = new.child_user_id;
  select organization_id into parent_org from public.profiles where id = new.parent_user_id;

  if child_org is null or child_org <> new.organization_id then
    raise exception 'child_user_id gehört nicht zur angegebenen Organisation';
  end if;
  if parent_org is null or parent_org <> new.organization_id then
    raise exception 'parent_user_id gehört nicht zur angegebenen Organisation';
  end if;

  with recursive ancestors as (
    select parent_user_id from public.org_assignments where child_user_id = new.parent_user_id
    union all
    select oa.parent_user_id
    from public.org_assignments oa
    join ancestors a on oa.child_user_id = a.parent_user_id
  )
  select exists (select 1 from ancestors where parent_user_id = new.child_user_id)
  into cycle_found;

  if cycle_found then
    raise exception 'Zuordnung würde einen Zyklus erzeugen';
  end if;

  return new;
end;
$$;

create trigger org_assignments_validate
  before insert or update on public.org_assignments
  for each row execute function public.validate_org_assignment();

alter table public.org_assignments enable row level security;

create policy "Org members can view assignments in their organization"
  on public.org_assignments
  for select
  to authenticated
  using (organization_id = public.current_user_org());

create policy "God can view all assignments"
  on public.org_assignments
  for select
  to authenticated
  using (public.current_user_role() = 'god');

create policy "Client admins can manage assignments in their organization"
  on public.org_assignments
  for all
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('client_admin')
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('client_admin')
  );

create policy "God can manage all assignments"
  on public.org_assignments
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select, insert, update, delete on public.org_assignments to authenticated;

-- ---------------------------------------------------------------
-- Hilfsfunktion: ist p_ancestor (transitiv) Vorgesetzte:r von
-- p_descendant gemäß org_assignments?
-- ---------------------------------------------------------------
create function public.is_ancestor_of(p_ancestor uuid, p_descendant uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  with recursive chain as (
    select parent_user_id from public.org_assignments where child_user_id = p_descendant
    union all
    select oa.parent_user_id
    from public.org_assignments oa
    join chain c on oa.child_user_id = c.parent_user_id
  )
  select exists (select 1 from chain where parent_user_id = p_ancestor);
$$;

-- ---------------------------------------------------------------
-- assessments: hierarchische Sicht ergänzen. Bisher konnte niemand
-- außer god und dem/der Ersteller:in selbst Ergebnisse einsehen -
-- client_admin sieht ab jetzt die ganze Organisation, alle anderen
-- Rollen (leader, ca_board, steering_committee, it_board) nur ihren
-- eigenen Teilbaum gemäß org_assignments.
-- ---------------------------------------------------------------
create policy "Assignees can view assessments of their reporting chain"
  on public.assessments
  for select
  to authenticated
  using (
    user_id is not null
    and public.is_ancestor_of(auth.uid(), user_id)
  );

create policy "Client admins can view assessments in their organization"
  on public.assessments
  for select
  to authenticated
  using (
    user_id is not null
    and public.current_user_has_org_role('client_admin')
    and exists (
      select 1 from public.profiles p
      where p.id = assessments.user_id
        and p.organization_id = public.current_user_org()
    )
  );
