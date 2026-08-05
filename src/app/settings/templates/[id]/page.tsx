import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { TemplateForm } from "@/components/settings/template-form";
import type { AssessmentTemplateRow } from "@/types/template";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["god"], "/settings/templates");
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("assessment_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Einstellungen
        </span>
        <h1 className="mt-1 mb-6 text-2xl font-semibold tracking-tight text-foreground">
          Template bearbeiten
        </h1>
        <TemplateForm template={data as AssessmentTemplateRow} />
      </div>
    </div>
  );
}
