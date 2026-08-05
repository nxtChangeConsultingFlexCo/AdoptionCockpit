-- Für die echte Roadmap-Ansicht: freie Phasen-Bezeichnung (z. B. "Q1
-- 2025", "Pilotphase") und optionales Zieldatum je Change Request.
-- Keine RLS-Änderung nötig - die bestehenden UPDATE-Policies (CA
-- Board/IT Board/client_admin/god sowie eigene/zugewiesene Anfragen)
-- decken auch diese beiden Spalten ab; welche Rollen die Felder in der
-- UI angeboten bekommen, wird in der Anwendung entschieden (CA Board
-- und client_admin).
alter table public.change_requests
  add column phase text,
  add column target_date date;

comment on column public.change_requests.phase is
  'Freitext-Phase für die Roadmap-Gruppierung, z. B. "Q1 2025" oder "Pilotphase". NULL = noch nicht eingeplant.';
comment on column public.change_requests.target_date is
  'Optionales Zieldatum für die Roadmap-Ansicht.';
