"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/settings/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ProfileForm({
  email,
  initialFirstName,
  initialLastName,
  initialPhone,
}: {
  email: string | null;
  initialFirstName: string;
  initialLastName: string;
  initialPhone: string;
}) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(initialPhone);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await updateProfile(firstName, lastName, phone);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess(true);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>Profil gespeichert.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">Vorname</Label>
          <Input
            id="first_name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">Nachname</Label>
          <Input
            id="last_name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" value={email ?? ""} disabled readOnly />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Telefon (optional)</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+49 …"
        />
      </div>

      <Button className="self-start" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Wird gespeichert…" : "Speichern"}
      </Button>
    </div>
  );
}
