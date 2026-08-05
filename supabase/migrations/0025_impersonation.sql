-- =============================================================
-- Mimik (Impersonation): god darf jede:n Nutzer:in ansehen,
-- client_admin nur Mitglieder der eigenen Organisation. Die Zeile
-- dient gleichzeitig als Session-Pointer (Cookie speichert nur die
-- id dieser Zeile) und als Audit-Trail (wer/wen/wann). Die reale
-- Supabase-Auth-Session des Admins bleibt dabei unverändert - es wird
-- keine neue Session für die Zielperson erzeugt, die Anwendung
-- überlagert die "aktuelle" Identität nur serverseitig anhand dieser
-- Zeile (siehe getCurrentUser() in src/lib/auth/roles.ts).
-- =============================================================
create table public.impersonation_audit (
  id uuid primary key default gen_random_uuid(),
  impersonator_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  check (impersonator_id <> target_user_id)
);

comment on table public.impersonation_audit is
  'Audit-Trail + Session-Pointer für Mimik. Ein Cookie referenziert die aktive Zeile (ended_at is null); die Autorisierung (god=alle, client_admin=eigene Org) wird per RLS beim Insert erzwungen, nicht nur in der Anwendung.';

alter table public.impersonation_audit enable row level security;

create policy "Admins can start impersonation sessions they're authorized for"
  on public.impersonation_audit
  for insert
  to authenticated
  with check (
    impersonator_id = auth.uid()
    and (
      public.current_user_role() = 'god'
      or (
        public.current_user_has_org_role('client_admin')
        and exists (
          select 1 from public.profiles target
          where target.id = impersonation_audit.target_user_id
            and target.organization_id = public.current_user_org()
        )
      )
    )
  );

create policy "Impersonators can view their own sessions"
  on public.impersonation_audit
  for select
  to authenticated
  using (impersonator_id = auth.uid());

create policy "God can view all impersonation sessions"
  on public.impersonation_audit
  for select
  to authenticated
  using (public.current_user_role() = 'god');

create policy "Impersonators can end their own sessions"
  on public.impersonation_audit
  for update
  to authenticated
  using (impersonator_id = auth.uid())
  with check (impersonator_id = auth.uid());

grant select, insert, update on public.impersonation_audit to authenticated;
