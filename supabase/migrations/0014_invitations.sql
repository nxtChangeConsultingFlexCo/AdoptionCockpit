-- =============================================================
-- Einladungen: Token-basiert statt Supabase-Invite-E-Mail, um die
-- bereits zweimal aufgetretene SMTP-Rate-Limit-Problematik zu
-- vermeiden. God erstellt eine Einladung, bekommt einen Link
-- (/register?invite=<token>) und verschickt ihn manuell über einen
-- beliebigen Kanal. Löst nebenbei die bisherige Lücke, wie mehrere
-- Mitarbeitende derselben Firma in dieselbe Organisation kommen.
-- =============================================================

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in (
    'client_admin', 'employee', 'leader', 'cab_member', 'it_board', 'steering_committee'
  )),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

comment on table public.invitations is 'Token-basierte Einladungen in eine Organisation, von god erstellt';

alter table public.invitations enable row level security;

create policy "God can manage invitations"
  on public.invitations
  for all
  to authenticated
  using (public.current_user_role() = 'god')
  with check (public.current_user_role() = 'god');

grant select, insert, update, delete on public.invitations to authenticated;

-- Gezielter, anonymer Lookup einer einzelnen Einladung per Token (für
-- die Registrierungsseite, bevor der Nutzer eingeloggt ist). Kein
-- direktes SELECT auf die Tabelle für anon, sonst könnte man alle
-- Einladungen/E-Mails auflisten - diese Funktion gibt ausschließlich
-- die zum exakten (unrateraren) Token passende Zeile zurück.
create function public.get_invitation_by_token(p_token uuid)
returns table (email text, role text, organization_id uuid, status text)
language sql
security definer
stable
set search_path = public
as $$
  select email, role, organization_id, status
  from public.invitations
  where token = p_token;
$$;

grant execute on function public.get_invitation_by_token(uuid) to anon, authenticated;

-- handle_new_user() erneut erweitert: erkennt einen gültigen, noch
-- ausstehenden Einladungs-Token mit passender E-Mail und tritt dann der
-- eingeladenen Organisation mit der vorgesehenen Rolle bei, statt (wie
-- bisher immer) eine neue Organisation anzulegen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
  invite_token_raw text;
  invite_token uuid;
  matched_invitation public.invitations%rowtype;
  resolved_org_id uuid;
  resolved_role text;
begin
  invite_token_raw := new.raw_user_meta_data ->> 'invite_token';

  if invite_token_raw is not null and invite_token_raw <> '' then
    begin
      invite_token := invite_token_raw::uuid;
    exception when others then
      invite_token := null;
    end;
  end if;

  if invite_token is not null then
    select * into matched_invitation
    from public.invitations
    where token = invite_token
      and status = 'pending'
      and lower(email) = lower(new.email)
    limit 1;
  end if;

  if matched_invitation.id is not null then
    resolved_org_id := matched_invitation.organization_id;
    resolved_role := matched_invitation.role;

    update public.invitations
    set status = 'accepted', accepted_at = now()
    where id = matched_invitation.id;
  else
    if new.raw_user_meta_data ->> 'company_name' is not null then
      insert into public.organizations (name)
      values (new.raw_user_meta_data ->> 'company_name')
      returning id into new_org_id;
    end if;
    resolved_org_id := new_org_id;
    resolved_role := case when new_org_id is not null then 'client_admin' else 'employee' end;
  end if;

  insert into public.profiles (
    id, first_name, last_name, company_name, job_title, email,
    gdpr_consent, marketing_consent, organization_id, role
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'company_name',
    new.raw_user_meta_data ->> 'job_title',
    new.email,
    coalesce((new.raw_user_meta_data ->> 'gdpr_consent')::boolean, false),
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false),
    resolved_org_id,
    resolved_role
  );
  return new;
end;
$$;
