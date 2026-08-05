-- =============================================================
-- Selbstständige Zuordnung: jede:r Nutzer:in darf die eigene Zeile in
-- org_assignments (child_user_id = sich selbst) setzen/ändern/löschen,
-- also z. B. selbst festlegen, wem sie/er zugeordnet ist ("Wer ist
-- meine Ansprechperson?"). Zuordnungen anderer bleiben client_admin/
-- god vorbehalten (siehe 0021). Der Zyklus- und Org-Check aus 0021
-- greift unverändert, unabhängig davon, wer schreibt.
-- =============================================================
create policy "Users can manage their own assignment"
  on public.org_assignments
  for all
  to authenticated
  using (child_user_id = auth.uid())
  with check (
    child_user_id = auth.uid()
    and organization_id = public.current_user_org()
  );
