import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssessmentFlow } from "@/components/assessment/assessment-flow";
import type { AssessmentQuestion } from "@/data/questions";
import type { TemplateSection } from "@/types/assessment";

export default async function AssessmentTemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("assessment_templates")
    .select("id, title, questions, sections, scale_min, scale_max")
    .eq("slug", slug)
    .maybeSingle();

  if (!template) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <AssessmentFlow
          templateId={template.id}
          templateTitle={template.title}
          questions={template.questions as AssessmentQuestion[]}
          sections={template.sections as TemplateSection[]}
          scaleMin={template.scale_min}
          scaleMax={template.scale_max}
          isAuthenticated={Boolean(user)}
        />
      </div>
    </div>
  );
}
