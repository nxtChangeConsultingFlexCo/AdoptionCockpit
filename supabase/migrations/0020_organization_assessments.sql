-- =============================================================
-- Zweistufiges Assessment-Modell:
--   - god-Templates sind plattformweit (organization_id null),
--     öffentlich katalogisiert, ohne kundenspezifische Daten.
--   - Client Admin/Consultant können ein god-Template übernehmen
--     und anpassen (based_on_template_id) oder ein rein org-eigenes
--     Assessment anlegen (organization_id gesetzt).
-- =============================================================
alter table public.assessment_templates
  add column organization_id uuid references public.organizations (id) on delete cascade,
  add column based_on_template_id uuid references public.assessment_templates (id) on delete set null;

comment on column public.assessment_templates.organization_id is
  'NULL = plattformweites god-Template. Sonst: Org-eigenes Assessment, nur für diese Organisation nutzbar.';
comment on column public.assessment_templates.based_on_template_id is
  'Optional: god-Template, von dem dieses Org-Assessment übernommen/angepasst wurde (u. a. für Empfehlungs-Vererbung).';

-- ---------------------------------------------------------------
-- organization_assessments: Freigabe + Reihenfolge von Templates
-- (god- oder org-eigen) je Organisation. Ist die maßgebliche Quelle
-- dafür, welche Checks Mitglieder einer Org sehen und starten dürfen -
-- nicht nur eine Katalog-Anzeige, sondern die eigentliche Freigabe.
-- ---------------------------------------------------------------
create table public.organization_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  template_id uuid not null references public.assessment_templates (id) on delete cascade,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, template_id)
);

comment on table public.organization_assessments is
  'Freigabe/Reihenfolge von Assessment-Templates je Organisation. Maßgeblich dafür, welche Checks eine Org aktuell nutzen darf.';

create trigger organization_assessments_set_updated_at
  before update on public.organization_assessments
  for each row execute function public.set_updated_at();

alter table public.organization_assessments enable row level security;

create policy "Org members can view their organization's assessment catalog"
  on public.organization_assessments
  for select
  to authenticated
  using (organization_id = public.current_user_org());

create policy "God can view all organization assessments"
  on public.organization_assessments
  for select
  to authenticated
  using (public.current_user_role() = 'god');

create policy "Client admins can manage their organization's assessment catalog"
  on public.organization_assessments
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

create policy "God can manage all organization assessments"
  on public.organization_assessments
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select, insert, update, delete on public.organization_assessments to authenticated;

-- ---------------------------------------------------------------
-- assessment_templates: Sichtbarkeit neu geregelt. Gäste sehen
-- weiterhin alle aktiven god-Templates (keine Org, keine Freigabe
-- nötig - öffentlicher Lead-Gen-Check). Angemeldete Org-Mitglieder
-- sehen ein Template (god oder org-eigen) nur noch, wenn es aktiv UND
-- über organization_assessments für ihre Org freigegeben ist.
-- ---------------------------------------------------------------
drop policy "Anyone can view active templates" on public.assessment_templates;

create policy "Guests can view active platform templates"
  on public.assessment_templates
  for select
  to anon
  using (is_active = true and organization_id is null);

create policy "Org members can view templates freigegeben for their org"
  on public.assessment_templates
  for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.organization_assessments oa
      where oa.template_id = assessment_templates.id
        and oa.organization_id = public.current_user_org()
        and oa.is_available = true
    )
  );

create policy "Client admins can manage templates in their organization"
  on public.assessment_templates
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

-- ---------------------------------------------------------------
-- Automatische Freigabe: neue god-Templates werden für alle
-- bestehenden Organisationen freigeschaltet, neue Organisationen
-- erhalten alle aktuell aktiven god-Templates. Client Admin kann
-- einzelne Checks danach für die eigene Org ausblenden
-- (is_available = false) statt bei jedem neuen god-Template manuell
-- zustimmen zu müssen. Org-eigene Templates werden bei Anlage
-- automatisch für die erstellende Org freigegeben.
-- ---------------------------------------------------------------
create function public.provision_organization_assessments_for_template()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organization_id is null then
    if new.is_active then
      insert into public.organization_assessments (organization_id, template_id)
      select o.id, new.id from public.organizations o
      on conflict (organization_id, template_id) do nothing;
    end if;
  else
    insert into public.organization_assessments (organization_id, template_id)
    values (new.organization_id, new.id)
    on conflict (organization_id, template_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger assessment_templates_provision_org_assessments
  after insert on public.assessment_templates
  for each row execute function public.provision_organization_assessments_for_template();

create function public.provision_organization_assessments_for_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_assessments (organization_id, template_id)
  select new.id, t.id
  from public.assessment_templates t
  where t.organization_id is null and t.is_active = true
  on conflict (organization_id, template_id) do nothing;
  return new;
end;
$$;

create trigger organizations_provision_assessments
  after insert on public.organizations
  for each row execute function public.provision_organization_assessments_for_org();

-- Backfill für bereits bestehende Organisationen/Templates.
insert into public.organization_assessments (organization_id, template_id)
select o.id, t.id
from public.organizations o
cross join public.assessment_templates t
where t.organization_id is null and t.is_active = true
on conflict (organization_id, template_id) do nothing;
