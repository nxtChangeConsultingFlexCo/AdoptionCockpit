import Link from "next/link";
import { signup } from "./actions";
import { createClient } from "@/lib/supabase/server";
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
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";

interface InvitationInfo {
  email: string;
  role: AppRole;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; invite?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/assessment";

  let invitation: InvitationInfo | null = null;
  if (params.invite) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_invitation_by_token", {
      p_token: params.invite,
    });
    const row = data?.[0];
    if (row && row.status === "pending") {
      invitation = { email: row.email, role: row.role as AppRole };
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
          <CardDescription>
            {invitation
              ? `Du wurdest als ${APP_ROLE_LABELS[invitation.role]} eingeladen.`
              : "Mit einem Konto findest du dein Check-Ergebnis jederzeit wieder."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {params.error && (
            <Alert variant="destructive">
              <AlertDescription>{params.error}</AlertDescription>
            </Alert>
          )}
          {params.invite && !invitation && (
            <Alert variant="destructive">
              <AlertDescription>
                Diese Einladung ist ungültig oder bereits verwendet.
              </AlertDescription>
            </Alert>
          )}
          <form action={signup} className="flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            {invitation && (
              <input type="hidden" name="invite_token" value={params.invite} />
            )}
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
            {!invitation && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company_name">Unternehmen</Label>
                <Input id="company_name" name="company_name" required />
              </div>
            )}
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
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={invitation?.email}
                readOnly={Boolean(invitation)}
                className={invitation ? "bg-muted" : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="gdpr_consent"
                  name="gdpr_consent"
                  required
                  className="mt-0.5"
                />
                <Label
                  htmlFor="gdpr_consent"
                  className="text-sm leading-snug font-normal"
                >
                  Ich stimme der Verarbeitung meiner Daten gemäß der
                  Datenschutzerklärung zur Durchführung von Status-Checks
                  zu. (Pflichtfeld)
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="marketing_consent"
                  name="marketing_consent"
                  className="mt-0.5"
                />
                <Label
                  htmlFor="marketing_consent"
                  className="text-sm leading-snug font-normal"
                >
                  Ich möchte künftig Informationen und Angebote rund um
                  KI-Adoption per E-Mail erhalten. (optional)
                </Label>
              </div>
            </div>

            <Button type="submit" className="mt-2">
              Registrieren
            </Button>
          </form>
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Bereits ein Konto?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="font-medium text-zinc-950 underline dark:text-zinc-50"
            >
              Jetzt anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
