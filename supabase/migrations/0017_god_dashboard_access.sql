-- god konnte bislang nur eigene assessments sehen (keine "god sieht
-- alles"-Policy existierte für diese Tabelle) - für die Admin-Dashboard-
-- Statistiken (Gesamtzahl, je Template) wird plattformweiter Lesezugriff
-- benötigt. Tabellen-Grant für authenticated ist bereits vorhanden, es
-- fehlte nur die Policy.
create policy "God can view all assessments"
  on public.assessments
  for select
  to authenticated
  using (public.current_user_role() = 'god');
