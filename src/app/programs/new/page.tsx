import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { createProgram } from "@/app/projects/actions";
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

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireRole(["god", "client_admin"], "/programs/new");
  const params = await searchParams;

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Neues Programm</CardTitle>
            <CardDescription>
              Eine optionale Klammer über mehreren Projekten - besitzt selbst
              keine eigenen Change Requests oder Roadmap-Einträge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {params.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{params.error}</AlertDescription>
              </Alert>
            )}
            <form action={createProgram} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="z. B. Digitalisierung 2026" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="goal">Ziel (optional)</Label>
                <textarea
                  id="goal"
                  name="goal"
                  rows={3}
                  placeholder="Was soll dieses Programm insgesamt erreichen?"
                  className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="target_date">Zieldatum (optional)</Label>
                <Input id="target_date" name="target_date" type="date" />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Button type="submit">Programm anlegen</Button>
                <Button type="button" variant="ghost" render={<Link href="/projects" />}>
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
