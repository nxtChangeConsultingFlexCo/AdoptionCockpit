-- =============================================================
-- Projekt-Mitgliedschaft als echte, DB-durchgesetzte Sichtbarkeits-
-- grenze. 0043 hat project_id auf change_requests/roadmap_items
-- eingeführt, aber bewusst KEINE RLS angefasst - Isolation lief
-- weiterhin nur über organization_id, project_id war reines
-- App-Level-Filtering. Jedes Org-Mitglied konnte auf API-Ebene weiter
-- die Change Requests jedes anderen Projekts derselben Org lesen.
--
-- project_members ist NUR das Sichtbarkeits-Primitiv "ist auf diesem
-- Projekt" - KEINE projekt-eigene Rolle. Was ein Mitglied in einem
-- Projekt DARF, kommt weiterhin unverändert aus seiner bestehenden
-- Org-Rolle (client_admin/ca_board/it_board/leader/...), geprüft über
-- current_user_has_org_role() wie bisher.
-- =============================================================

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

comment on table public.project_members is
  'Sichtbarkeits-Primitiv: entscheidet, ob ein Org-Mitglied ein Projekt und dessen change_requests/roadmap_items sehen darf. Keine projekt-eigene Rolle - was ein Mitglied darf, kommt weiterhin aus seiner Org-Rolle (current_user_has_org_role).';

-- Org-Konsistenz strukturell erzwingen (nicht nur über die Schreib-
-- Policy client_admin/god) - analog zu validate_org_assignment() in
-- 0021: das hinzugefügte Mitglied muss zur Organisation des Projekts
-- gehören.
create function public.validate_project_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_org uuid;
  project_org uuid;
begin
  select organization_id into member_org from public.profiles where id = new.user_id;
  select organization_id into project_org from public.projects where id = new.project_id;

  if member_org is null or member_org <> project_org then
    raise exception 'user_id gehört nicht zur Organisation des Projekts';
  end if;

  return new;
end;
$$;

create trigger project_members_validate
  before insert or update on public.project_members
  for each row execute function public.validate_project_member();

-- ---------------------------------------------------------------
-- Zentraler Sichtbarkeits-Helper, im Stil von current_user_has_org_role
-- (0016): sichtbar ist ein Projekt für god (plattformweit), für
-- client_admin der eigenen Organisation (Admins sehen alle Projekte
-- ihrer Org, ohne überall Mitglied sein zu müssen), oder für
-- eingetragene project_members.
-- ---------------------------------------------------------------
create function public.current_user_can_access_project(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.current_user_role() = 'god'
    or exists (
      select 1 from public.projects p
      where p.id = p_project_id
        and p.organization_id = public.current_user_org()
        and (
          public.current_user_has_org_role('client_admin')
          or exists (
            select 1 from public.project_members pm
            where pm.project_id = p.id and pm.user_id = auth.uid()
          )
        )
    );
$$;

alter table public.project_members enable row level security;

create policy "Members can view visible project's membership"
  on public.project_members
  for select
  to authenticated
  using (public.current_user_can_access_project(project_id));

create policy "Client admins can manage members of their organization's projects"
  on public.project_members
  for all
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.organization_id = public.current_user_org()
        and public.current_user_has_org_role('client_admin')
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_members.project_id
        and p.organization_id = public.current_user_org()
        and public.current_user_has_org_role('client_admin')
    )
  );

create policy "God can manage all project members"
  on public.project_members
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select, insert, update, delete on public.project_members to authenticated;

-- =============================================================
-- Backfill - VOR dem Verschärfen der Lese-Policies unten, sonst
-- verlieren bestehende Nutzer:innen zwischenzeitlich Zugriff. Für
-- jedes JETZT bestehende Projekt wird jedes Mitglied der zugehörigen
-- Organisation als project_member eingetragen (über
-- profiles.organization_id) - das erhält die heutige Sichtbarkeit
-- (jede/r Org-Nutzer:in sieht heute alles) exakt, unabhängig davon,
-- ob es sich um ein 0043-Default-Projekt oder ein seither manuell
-- angelegtes Projekt handelt.
-- =============================================================
insert into public.project_members (project_id, user_id, added_by)
select p.id, pr.id, p.created_by
from public.projects p
join public.profiles pr on pr.organization_id = p.organization_id
on conflict (project_id, user_id) do nothing;

-- Falls für ein bestehendes Projekt bereits ein lead gesetzt ist:
-- sicherstellen, dass er/sie Mitglied ist (durch den Backfill oben
-- bereits abgedeckt, hier zusätzlich explizit für Robustheit/Klarheit).
insert into public.project_members (project_id, user_id, added_by)
select p.id, p.lead, p.created_by
from public.projects p
where p.lead is not null
on conflict (project_id, user_id) do nothing;

-- =============================================================
-- Lese-Policies verschärfen: von "alle Org-Mitglieder" auf "Projekt
-- sichtbar" (current_user_can_access_project). Bestehende Rollen-/
-- Status-Gates auf den Schreib-Policies bleiben unverändert - die
-- Projekt-Sichtbarkeit wird dort nur als ZUSÄTZLICHE Bedingung
-- ergänzt. god-Policies und die admin-weite Update-Policy
-- ("Client admins and god can update any request in scope") bleiben
-- unangetastet: current_user_can_access_project gewährt client_admin/
-- god ohnehin bereits Zugriff auf jedes Projekt ihrer Org bzw. jedes
-- Projekt überhaupt.
-- =============================================================

alter policy "Org members can view their organization's projects"
  on public.projects
  using (public.current_user_can_access_project(id));

-- change_requests: SELECT
alter policy "Leaders can view requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('leader')
    and public.current_user_can_access_project(project_id)
  );

alter policy "Org members can view relevant change requests"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
    and (
      public.current_user_has_org_role('client_admin')
      or public.current_user_has_org_role('ca_board')
      or public.current_user_has_org_role('it_board')
      or public.current_user_has_org_role('steering_committee')
      or requested_by = auth.uid()
      or assigned_leader = auth.uid()
    )
  );

-- change_requests: INSERT
alter policy "Org members can create change requests"
  on public.change_requests
  with check (
    organization_id = public.current_user_org()
    and requested_by = auth.uid()
    and public.current_user_can_access_project(project_id)
  );

-- change_requests: UPDATE (Rollen-/Status-Gates unverändert, Projekt-
-- Sichtbarkeit ergänzt)
alter policy "Assigned leaders can update their requests"
  on public.change_requests
  using (
    assigned_leader = auth.uid()
    and organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  );

alter policy "CA Board can update requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('ca_board')
    and public.current_user_can_access_project(project_id)
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  );

alter policy "IT board can update requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('it_board')
    and public.current_user_can_access_project(project_id)
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  );

alter policy "Leaders can triage requests in their organization"
  on public.change_requests
  using (
    organization_id = public.current_user_org()
    and public.current_user_has_org_role('leader')
    and public.current_user_can_access_project(project_id)
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  );

alter policy "Requesters can edit their own draft requests"
  on public.change_requests
  using (
    requested_by = auth.uid()
    and organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  )
  with check (
    organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  );

-- change_requests: DELETE
alter policy "Requesters can delete their own draft requests"
  on public.change_requests
  using (
    requested_by = auth.uid()
    and status = 'draft'
    and organization_id = public.current_user_org()
    and public.current_user_can_access_project(project_id)
  );

-- roadmap_items: SELECT (ersetzt organization_id-Check, current_user_can_access_project prüft Org bereits mit)
alter policy "Org members can view their organization's roadmap items"
  on public.roadmap_items
  using (public.current_user_can_access_project(project_id));

-- roadmap_items: ALL (client_admin/ca_board) - Rollen-Gate unverändert, Projekt-Sichtbarkeit ergänzt
alter policy "Client admins and CA board can manage roadmap items"
  on public.roadmap_items
  using (
    organization_id = public.current_user_org()
    and (
      public.current_user_has_org_role('client_admin')
      or public.current_user_has_org_role('ca_board')
    )
    and public.current_user_can_access_project(project_id)
  )
  with check (
    organization_id = public.current_user_org()
    and (
      public.current_user_has_org_role('client_admin')
      or public.current_user_has_org_role('ca_board')
    )
    and public.current_user_can_access_project(project_id)
  );
