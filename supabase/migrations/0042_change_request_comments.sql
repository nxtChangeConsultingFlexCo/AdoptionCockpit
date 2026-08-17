-- =============================================================
-- Diskussions-Thread an Change Requests: bislang gab es nur einzelne
-- Entscheidungsnotiz-Felder (cab_decision_note, it_feedback) für die
-- formale Freigabe, aber keinen Ort für Hin-und-Her-Austausch während
-- der Prüfung. RLS spiegelt change_request_events (Migration 0034):
-- sichtbar für alle, die die zugehörige Anfrage sehen dürfen, kein
-- UPDATE/DELETE-Grant (unveränderliches Protokoll wie bei den Events).
-- =============================================================
create table public.change_request_comments (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null references public.change_requests (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

comment on table public.change_request_comments is
  'Diskussions-Thread je Change Request, ergänzend zu den formalen Entscheidungsnotizen. Unveränderlich (kein UPDATE/DELETE-Grant).';

alter table public.change_request_comments enable row level security;

create policy "Users can view comments for change requests they can see"
  on public.change_request_comments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.change_requests cr
      where cr.id = change_request_comments.change_request_id
    )
  );

create policy "Users can comment on change requests in their org"
  on public.change_request_comments
  for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      public.current_user_role() = 'god'
      or exists (
        select 1 from public.change_requests cr
        where cr.id = change_request_comments.change_request_id
          and cr.organization_id = public.current_user_org()
      )
    )
  );

grant select, insert on public.change_request_comments to authenticated;
