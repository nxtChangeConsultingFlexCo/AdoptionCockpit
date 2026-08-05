-- =============================================================
-- Change Requests: Mitarbeiter -> Cluster Lead -> CAB -> IT Board
-- =============================================================

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text not null,
  requested_by uuid references public.profiles (id) on delete set null,
  assigned_leader uuid references public.profiles (id) on delete set null,
  status text not null default 'draft' check (status in (
    'draft', 'submitted', 'cab_review', 'qualified',
    'it_backlog', 'in_implementation', 'done', 'rejected'
  )),
  cab_decision_note text,
  it_feedback text,
  priority text check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.change_requests is
  'Änderungsideen im Change-Governance-Prozess: Mitarbeiter -> Cluster Lead -> CAB -> IT Board';
comment on column public.change_requests.assigned_leader is 'Zuständiger Cluster Lead (Botschafter)';
comment on column public.change_requests.cab_decision_note is 'Begründung des Change Advisory Board zur Qualifizierung/Ablehnung';
comment on column public.change_requests.it_feedback is 'Rückmeldung des IT Boards zu Planung/Umsetzung';

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger change_requests_set_updated_at
  before update on public.change_requests
  for each row execute function public.set_updated_at();

alter table public.change_requests enable row level security;

-- Einreichen: jedes Org-Mitglied darf Change Requests für die eigene
-- Organisation anlegen, immer im eigenen Namen.
create policy "Org members can create change requests"
  on public.change_requests
  for insert
  to authenticated
  with check (
    organization_id = public.current_user_org()
    and requested_by = auth.uid()
  );

-- Lesen: Mitarbeiter/Leader sehen nur eigene bzw. ihnen zugewiesene
-- Anfragen. Board-Rollen (client_admin, cab_member, it_board,
-- steering_committee) sehen alle Anfragen ihrer Organisation - ein
-- Gremium braucht Kontext, nicht nur die aktuelle Warteschlange.
create policy "Org members can view relevant change requests"
  on public.change_requests
  for select
  to authenticated
  using (
    organization_id = public.current_user_org()
    and (
      public.current_user_role() in ('client_admin', 'cab_member', 'it_board', 'steering_committee')
      or requested_by = auth.uid()
      or assigned_leader = auth.uid()
    )
  );

create policy "God can view all change requests"
  on public.change_requests
  for select
  to authenticated
  using (public.current_user_role() = 'god');

-- Aktualisieren: jede Rolle darf innerhalb ihres Zuständigkeitsbereichs
-- Status/Notizen pflegen. Keine feste Status-Übergangslogik in der DB -
-- das bleibt bewusst einfach und wird in der Anwendungsschicht geführt.
create policy "Requesters can edit their own draft requests"
  on public.change_requests
  for update
  to authenticated
  using (
    requested_by = auth.uid()
    and organization_id = public.current_user_org()
  )
  with check (organization_id = public.current_user_org());

create policy "Assigned leaders can update their requests"
  on public.change_requests
  for update
  to authenticated
  using (
    assigned_leader = auth.uid()
    and organization_id = public.current_user_org()
  )
  with check (organization_id = public.current_user_org());

create policy "CAB members can update requests in their organization"
  on public.change_requests
  for update
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_role() = 'cab_member'
  )
  with check (organization_id = public.current_user_org());

create policy "IT board can update requests in their organization"
  on public.change_requests
  for update
  to authenticated
  using (
    organization_id = public.current_user_org()
    and public.current_user_role() = 'it_board'
  )
  with check (organization_id = public.current_user_org());

create policy "Client admins and god can update any request in scope"
  on public.change_requests
  for update
  to authenticated
  using (
    (organization_id = public.current_user_org() and public.current_user_role() = 'client_admin')
    or public.current_user_role() = 'god'
  )
  with check (true);

-- Löschen: nur eigene, noch nicht eingereichte Entwürfe.
create policy "Requesters can delete their own draft requests"
  on public.change_requests
  for delete
  to authenticated
  using (
    requested_by = auth.uid()
    and status = 'draft'
    and organization_id = public.current_user_org()
  );

grant select, insert, update, delete on public.change_requests to authenticated;
