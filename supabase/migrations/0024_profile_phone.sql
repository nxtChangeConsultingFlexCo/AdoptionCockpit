-- Für den User-Settings-Bereich: optionales Telefonfeld im eigenen Profil.
alter table public.profiles add column phone text;

comment on column public.profiles.phone is 'Optionale Telefonnummer, selbst gepflegt im Profil-Bereich.';
