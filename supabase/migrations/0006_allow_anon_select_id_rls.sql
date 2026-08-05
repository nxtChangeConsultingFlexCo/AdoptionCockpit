-- Zweiter Teil desselben RETURNING-Problems: Unter RLS muss eine
-- INSERT ... RETURNING-Abfrage zusätzlich eine passende SELECT-Policy
-- erfüllen, sonst schlägt sie mit "new row violates row-level security
-- policy" fehl - selbst wenn die INSERT-Policy (0001) "with check (true)"
-- erlaubt. Diese Policy ist bewusst weit ("using (true)"), bleibt aber
-- durch den Column-Grant aus 0005 (nur "id") wirksam eingeschränkt: anon
-- kann dadurch ausschließlich die id-Spalte lesen, nie E-Mail, Firma o. Ä.
create policy "Anon can read back assessment ids"
  on public.assessments
  for select
  to anon
  using (true);
