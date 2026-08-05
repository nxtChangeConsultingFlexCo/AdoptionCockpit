-- Root Cause eines "permission denied for table assessments"-Fehlers bei
-- Gast-Einreichungen: Postgres verlangt für INSERT ... RETURNING <spalte>
-- zusätzlich SELECT-Recht auf die zurückgegebene(n) Spalte(n) - nicht nur
-- INSERT. Unser App-Code liest nach dem Insert die generierte id zurück
-- (.select("id")), dafür fehlte anon bislang jedes SELECT-Recht (bewusst,
-- um volle Zeilen-Lesbarkeit zu verhindern). Minimal-invasiver Fix: nur die
-- id-Spalte freigeben, keine anderen (potenziell sensiblen) Spalten.
grant select (id) on public.assessments to anon;
