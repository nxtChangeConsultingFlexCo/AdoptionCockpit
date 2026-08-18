-- =============================================================
-- Rollback für supabase/migrations/0043_programs_and_projects.sql.
-- Kein Bestandteil der normalen Migrationskette (liegt bewusst außerhalb
-- von supabase/migrations, sonst würde die Supabase-CLI sie als eigene
-- Vorwärts-Migration einspielen) - bei Bedarf manuell ausführen, z.B.:
--   psql "$DATABASE_URL" -f supabase/rollbacks/0043_programs_and_projects_down.sql
--
-- WARNUNG: Entfernt project_id von change_requests/roadmap_items und
-- löscht ALLE Zeilen in projects/programs, nicht nur die beim Forward-
-- Migrieren automatisch angelegten Default-Projekte. Falls nach 0043
-- bereits echte Projekte/Programme angelegt wurden, gehen diese
-- verloren - vorher Backup ziehen.
-- =============================================================

alter table public.roadmap_items drop column if exists project_id;
alter table public.change_requests drop column if exists project_id;

drop policy if exists "God can manage all projects" on public.projects;
drop policy if exists "Client admins can manage projects in their organization" on public.projects;
drop policy if exists "God can view all projects" on public.projects;
drop policy if exists "Org members can view their organization's projects" on public.projects;

drop policy if exists "God can manage all programs" on public.programs;
drop policy if exists "Client admins can manage programs in their organization" on public.programs;
drop policy if exists "God can view all programs" on public.programs;
drop policy if exists "Org members can view their organization's programs" on public.programs;

drop trigger if exists projects_set_updated_at on public.projects;
drop trigger if exists programs_set_updated_at on public.programs;

-- set_updated_at() wird von anderen Tabellen (change_requests,
-- roadmap_items, ...) weiterverwendet und daher hier NICHT gedroppt.

drop table if exists public.projects;
drop table if exists public.programs;
