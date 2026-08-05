-- Roh per SQL erstellte Tabellen erhalten in Supabase keine automatischen
-- Postgres-GRANTs für die Rollen anon/authenticated (anders als über den
-- Table Editor angelegte Tabellen). Ohne diese GRANTs schlägt jede Anfrage
-- über PostgREST mit "permission denied" fehl, bevor RLS überhaupt greift.
-- RLS-Policies (siehe 0001, 0002) regeln weiterhin, welche Zeilen sichtbar
-- sind - diese GRANTs regeln nur, ob die Operation grundsaetzlich erlaubt ist.

grant usage on schema public to anon, authenticated;

grant insert on public.assessments to anon;
grant select, insert on public.assessments to authenticated;

grant select, update on public.profiles to authenticated;
