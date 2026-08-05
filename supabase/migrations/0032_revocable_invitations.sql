-- =============================================================
-- Einladungen zurückziehbar: neuer Status 'revoked'. Sobald eine
-- Einladung diesen Status hat, matcht handle_new_user() (0014, prüft
-- "status = 'pending'") sie nicht mehr - der Link/Token wird beim
-- Registrieren also automatisch ungültig, ohne dass dort etwas
-- geändert werden musste. Schreibrechte (UPDATE auf eigene Org bzw.
-- alle für god) existieren bereits seit 0014/0015 - keine neue
-- RLS-Policy nötig.
-- =============================================================
alter table public.invitations
  drop constraint if exists invitations_status_check;

alter table public.invitations
  add constraint invitations_status_check
  check (status in ('pending', 'accepted', 'revoked'));

-- "Erneutes Einladen derselben E-Mail danach wieder erlaubt": nur
-- eine offene (pending) Einladung pro E-Mail+Organisation gleichzeitig
-- - nach Zurückziehen (revoked) oder Annahme (accepted) ist die
-- E-Mail für eine neue Einladung wieder frei.
create unique index invitations_pending_email_org_idx
  on public.invitations (organization_id, lower(email))
  where status = 'pending';
