-- =============================================================
-- Direkt erstellbare Roadmap-Einträge: Client Admin und CA Board
-- können Punkte auf der Plan-Ansicht anlegen, ohne dass eine Change-
-- Request-Qualifizierung nötig ist. Bewusst eine eigene, schlanke
-- Tabelle statt change_requests zweckzuentfremden - dort hängen
-- Status-Enum, requested_by, cab_decision_note etc. am
-- Anfragen-Workflow und passen nicht zu einem manuell angelegten
-- Punkt.
-- =============================================================
create table public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  phase text,
  target_date date,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'done')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.roadmap_items is
  'Manuell angelegte Roadmap-Punkte (Ergänzung zu qualifizierten change_requests in der Plan-Ansicht).';

create trigger roadmap_items_set_updated_at
  before update on public.roadmap_items
  for each row execute function public.set_updated_at();

alter table public.roadmap_items enable row level security;

-- Lesen: alle Org-Mitglieder (Business User lesen nur, siehe Anwendung),
-- plus god.
create policy "Org members can view their organization's roadmap items"
  on public.roadmap_items
  for select
  to authenticated
  using (organization_id = public.current_user_org());

create policy "God can view all roadmap items"
  on public.roadmap_items
  for select
  to authenticated
  using (public.current_user_role() = 'god');

-- Schreiben: client_admin und CA Board der eigenen Organisation, sowie
-- god überall.
create policy "Client admins and CA board can manage roadmap items"
  on public.roadmap_items
  for all
  to authenticated
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

create policy "God can manage all roadmap items"
  on public.roadmap_items
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select, insert, update, delete on public.roadmap_items to authenticated;
