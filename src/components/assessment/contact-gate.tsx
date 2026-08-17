"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GuestContact } from "@/app/assessment/actions";

interface ContactGateProps {
  slug: string;
  onSubmitGuest: (contact: GuestContact) => void;
  isPending: boolean;
  error: string | null;
}

export function ContactGate({ slug, onSubmitGuest, isPending, error }: ContactGateProps) {
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  // Muss auf die konkrete Check-Seite zurückführen (nicht /assessment,
  // das nur auf die Startseite weiterleitet) - dort liegen die im
  // sessionStorage gesicherten Antworten und die Logik, die sie nach
  // erfolgreicher Anmeldung automatisch wiederherstellt und einreicht.
  const next = `/assessment/${slug}`;

  function handleSubmit(formData: FormData) {
    onSubmitGuest({
      email: String(formData.get("email") ?? ""),
      firstName: String(formData.get("first_name") ?? ""),
      lastName: String(formData.get("last_name") ?? ""),
      companyName: String(formData.get("company_name") ?? ""),
      jobTitle: String(formData.get("job_title") ?? ""),
      gdprConsent,
      marketingConsent,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Fast geschafft
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Du hast alle Fragen beantwortet. Um dein Ergebnis zu sehen,
          registriere dich oder teile uns kurz deine Kontaktdaten mit.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mit Konto fortfahren</CardTitle>
          <CardDescription>
            Deine Antworten bleiben erhalten – nach Anmeldung geht es direkt
            mit deinem Ergebnis weiter.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button
            variant="outline"
            render={<Link href={`/login?next=${encodeURIComponent(next)}`} />}
          >
            Anmelden
          </Button>
          <Button render={<Link href={`/register?next=${encodeURIComponent(next)}`} />}>
            Registrieren
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        oder als Gast fortfahren
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Als Gast fortfahren</CardTitle>
          <CardDescription>
            Wir benötigen diese Angaben, um dir dein Ergebnis zuordnen zu
            können.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">Vorname</Label>
                <Input id="first_name" name="first_name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Nachname</Label>
                <Input id="last_name" name="last_name" required />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company_name">Unternehmen</Label>
              <Input id="company_name" name="company_name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="job_title">Funktion</Label>
              <Input
                id="job_title"
                name="job_title"
                placeholder="z. B. Geschäftsführung, IT-Leitung"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="gate_gdpr_consent"
                  checked={gdprConsent}
                  onCheckedChange={(checked) => setGdprConsent(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="gate_gdpr_consent"
                  className="text-sm leading-snug font-normal"
                >
                  Ich stimme der Verarbeitung meiner Daten gemäß der
                  Datenschutzerklärung zur Auswertung dieses Checks zu.
                  (Pflichtfeld)
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="gate_marketing_consent"
                  checked={marketingConsent}
                  onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="gate_marketing_consent"
                  className="text-sm leading-snug font-normal"
                >
                  Ich möchte künftig Informationen und Angebote rund um
                  KI-Adoption per E-Mail erhalten. (optional)
                </Label>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={!gdprConsent || isPending}>
              {isPending ? "Wird gespeichert…" : "Ergebnis anzeigen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
