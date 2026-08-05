import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/roles";
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
  // god ist Plattform-Admin, kein Enduser - landet immer im Admin-Bereich.
  const currentUser = await getCurrentUser();
  if (currentUser?.role === "god") {
    redirect("/admin");
  }

  const supabase = await createClient();
  let templates: AssessmentTemplateSummary[] = [];

  if (currentUser?.organizationId) {
    // Angemeldete Org-Mitglieder sehen den freigegebenen Katalog ihrer
    // Organisation (god- und org-eigene Templates), nicht automatisch
    // jedes plattformweite Template.
    const { data } = await supabase
      .from("organization_assessments")
      .select(
        "sort_order, assessment_templates(id, title, description, slug, is_active)",
      )
      .eq("organization_id", currentUser.organizationId)
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    templates = ((data ?? []) as unknown as Array<{
      assessment_templates: AssessmentTemplateSummary & { is_active: boolean };
    }>)
      .map((row) => row.assessment_templates)
      .filter((template): template is AssessmentTemplateSummary & { is_active: boolean } =>
        Boolean(template?.is_active),
      );
  } else {
    // Gäste (nicht angemeldet) sehen den öffentlichen god-Katalog.
    const { data } = await supabase
      .from("assessment_templates")
      .select("id, title, description, slug")
      .eq("is_active", true)
      .is("organization_id", null)
      .order("sort_order", { ascending: true });

    templates = (data ?? []) as AssessmentTemplateSummary[];
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <section className="flex w-full max-w-2xl flex-col items-center gap-6 px-6 pt-24 pb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          KI-Readiness-Check
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
            Aktuell ist kein Check verfügbar.
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
