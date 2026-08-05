import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AssessmentTemplateSummary } from "@/types/template";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessment_templates")
    .select("id, title, description, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const templates = (data ?? []) as AssessmentTemplateSummary[];

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <section className="flex w-full max-w-2xl flex-col items-center gap-6 px-6 pt-24 pb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          KI-Readiness-Assessment
        </h1>
        <p className="max-w-lg text-lg leading-8 text-muted-foreground">
          Finde in wenigen Minuten heraus, wie bereit dein Unternehmen für den
          Einsatz von Künstlicher Intelligenz ist – wähle unten den
          passenden Check.
        </p>
      </section>

      <section className="w-full max-w-3xl px-6 pb-24">
        {templates.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Aktuell ist kein Assessment verfügbar.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id} className="flex h-full flex-col">
                <CardHeader>
                  <CardTitle>{template.title}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-2">
                  <Button
                    render={<Link href={`/assessment/${template.slug}`} />}
                  >
                    Check starten
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
