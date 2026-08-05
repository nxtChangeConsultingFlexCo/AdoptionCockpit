import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { TemplateActiveToggle } from "@/components/settings/template-active-toggle";
import type { AssessmentTemplateRow } from "@/types/template";

type TemplateListItem = Pick<
  AssessmentTemplateRow,
  "id" | "title" | "slug" | "is_active" | "sort_order" | "questions"
>;

export default async function TemplatesPage() {
  await requireRole(["god"], "/settings/templates");
  const supabase = await createClient();

  const { data } = await supabase
    .from("assessment_templates")
    .select("id, title, slug, is_active, sort_order, questions")
    .order("sort_order", { ascending: true });

  const templates = (data ?? []) as TemplateListItem[];

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Einstellungen
            </span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              Assessment-Templates
            </h1>
          </div>
          <Button render={<Link href="/settings/templates/new" />}>
            Neues Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            Noch keine Templates vorhanden.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
              >
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/settings/templates/${template.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {template.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    /{template.slug} · {template.questions.length} Fragen ·
                    Reihenfolge {template.sort_order}
                  </span>
                </div>
                <TemplateActiveToggle
                  id={template.id}
                  isActive={template.is_active}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
