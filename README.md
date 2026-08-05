# AdoptionCockpit

KI-Readiness-Assessment für den Mittelstand – einbettbar auf der eigenen Website.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Base UI)
- [Supabase](https://supabase.com) (Postgres + Auth + Client SDK)

## Setup

```bash
npm install
cp .env.example .env.local   # Werte aus dem Supabase Dashboard eintragen
npm run dev
```

App läuft danach unter [http://localhost:3000](http://localhost:3000).

## Environment Variables

Siehe [.env.example](./.env.example):

- `NEXT_PUBLIC_SUPABASE_URL` – Projekt-URL (Project Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Public Anon Key (Frontend-sicher)
- `SUPABASE_SERVICE_ROLE_KEY` – nur server-seitig, niemals committen

## Datenmodell

Die SQL-Migrationen liegen in [supabase/migrations](./supabase/migrations) und
müssen der Reihe nach im Supabase SQL-Editor (oder via Supabase CLI)
ausgeführt werden:

1. `0001_create_assessments_table.sql` – Tabelle `assessments`
2. `0002_add_auth_and_contact_fields.sql` – Tabelle `profiles`,
   Auto-Anlage bei Registrierung (Trigger), Kontakt-/Consent-Felder auf
   `assessments` (`user_id`, `first_name`, `last_name`, `role`,
   `gdpr_consent`, `marketing_consent`) sowie RLS-Policies

Die 4 bewerteten Dimensionen sind in
[src/types/assessment.ts](./src/types/assessment.ts) definiert:

- Datenqualität
- Prozessklarheit
- Kulturelle Akzeptanz
- Governance & Compliance

Der Fragenkatalog (14 Fragen, Skala 1–5) liegt in
[src/data/questions.ts](./src/data/questions.ts).

## Auth-Hinweis

Standardmäßig verlangt ein neues Supabase-Projekt eine E-Mail-Bestätigung
nach der Registrierung ("Confirm email" in Authentication → Settings). Ist
das aktiviert, wird der Nutzer nach `signUp()` noch nicht eingeloggt und
landet auf `/register/confirm`. Für einen reibungslosen Test-Flow ohne
E-Mail-Versand kann diese Option im Supabase Dashboard deaktiviert werden.

## Assessment-Flow

1. `/assessment` – Fragebogen (eine Seite, alle 4 Dimensionen)
2. Nach Beantwortung aller Fragen:
   - **Eingeloggt:** Ergebnis wird direkt berechnet und gespeichert.
   - **Nicht eingeloggt:** Gate mit zwei Optionen – Login/Registrierung
     (Antworten bleiben über `sessionStorage` erhalten) oder Fortfahren als
     Gast mit Pflichtfeldern (Name, Unternehmen, E-Mail) + Pflicht-DSGVO-
     Checkbox + optionaler Marketing-Einwilligung.
3. Ergebnis-Anzeige mit Score je Dimension + Gesamt-Score.

## Projektstruktur

```
src/
  app/
    page.tsx                 Startseite
    assessment/               Fragebogen-Seite + Server Actions zum Speichern
    login/, register/         Auth-Seiten + Server Actions
  components/
    ui/                        shadcn/ui-Komponenten
    assessment/                 Flow, Gate, Ergebnis-Anzeige
    site-header.tsx              Nav mit Login-Status
  data/questions.ts            Fragenkatalog
  lib/
    supabase/                    Browser-, Server- & Middleware-Client
    scoring.ts                    Score-Berechnung
    auth-actions.ts                Logout Server Action
  types/                          Geteilte TypeScript-Typen
  proxy.ts                        Middleware (Next 16: "proxy"-Convention) für Session-Refresh
supabase/
  migrations/                     SQL-Schema
```
