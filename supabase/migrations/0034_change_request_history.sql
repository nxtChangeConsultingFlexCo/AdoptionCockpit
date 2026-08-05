-- =============================================================
-- Änderungsverlauf für Change Requests: jede inhaltliche Änderung
-- (Titel/Beschreibung/Priorität durch die neue Bearbeiten-Funktion,
-- aber auch Status-Übergänge, CA-Board-Entscheidung, IT-Feedback und
-- Roadmap-Planung durch die bestehenden Aktionen) wird hier statt
-- stillschweigend überschrieben protokolliert. Ein Feld pro Zeile
-- (nicht ein großer jsonb-Snapshot), damit sich der Verlauf einfach
-- als Zeitleiste "Feld X: alt -> neu" rendern lässt.
-- =============================================================
create table public.change_request_events (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null references public.change_requests (id) on delete cascade,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  field text not null,
  old_value text,
  new_value text
);

comment on table public.change_request_events is
  'Änderungsverlauf: eine Zeile je geändertem Feld. Wird von den Server Actions befüllt, nie im Nachhinein verändert (kein UPDATE/DELETE-Grant).';

alter table public.change_request_events enable row level security;

-- Sichtbarkeit spiegelt die des zugehörigen change_requests: die
-- Subquery unterliegt selbst der RLS von change_requests, ein Nutzer
-- sieht die Historie also genau dann, wenn er die Anfrage selbst
-- sehen darf (inkl. god über dessen eigene Policy dort).
create policy "Users can view events for change requests they can see"
  on public.change_request_events
  for select
  to authenticated
  using (
    exists (
      select 1 from public.change_requests cr
      where cr.id = change_request_events.change_request_id
    )
  );

create policy "Users can log events for change requests in their org"
  on public.change_request_events
  for insert
  to authenticated
  with check (
    changed_by = auth.uid()
    and (
      public.current_user_role() = 'god'
      or exists (
        select 1 from public.change_requests cr
        where cr.id = change_request_events.change_request_id
          and cr.organization_id = public.current_user_org()
      )
    )
  );

grant select, insert on public.change_request_events to authenticated;
