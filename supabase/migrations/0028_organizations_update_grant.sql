-- 0027 fügte eine "God can update any organization"-RLS-Policy hinzu,
-- aber organizations hatte bisher nur "grant select" (0007) - ohne den
-- UPDATE-Grant kommt jeder Schreibversuch nie bis zur RLS-Prüfung
-- (schlägt schon auf Privilegien-Ebene fehl). RLS bleibt die
-- eigentliche Einschränkung auf god.
grant update on public.organizations to authenticated;
