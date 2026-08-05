import Link from "next/link";
import { requireUser } from "@/lib/auth/roles";
import { createChangeRequest } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CHANGE_REQUEST_PRIORITY_LABELS } from "@/types/governance";

export default async function NewChangeRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser("/change-requests/new");
  const params = await searchParams;

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Neue Idee einreichen</CardTitle>
            <CardDescription>
              Beschreibe kurz, was verändert oder verbessert werden sollte.
              Dein Cluster Lead und das Change Advisory Board prüfen deine
              Anfrage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {params.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{params.error}</AlertDescription>
              </Alert>
            )}
            <form action={createChangeRequest} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="z. B. Automatisierte Rechnungsprüfung"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Beschreibung</Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  placeholder="Was ist das Problem oder die Idee? Was würde sich dadurch verbessern?"
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="priority">Priorität (optional)</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue=""
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="">Keine Angabe</option>
                  {Object.entries(CHANGE_REQUEST_PRIORITY_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Button type="submit">Anfrage einreichen</Button>
                <Button
                  type="button"
                  variant="ghost"
                  render={<Link href="/change-requests" />}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
