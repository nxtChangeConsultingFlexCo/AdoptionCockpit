import { requireRole } from "@/lib/auth/roles";
import { TemplateForm } from "@/components/settings/template-form";

export default async function NewTemplatePage() {
  await requireRole(["god"], "/settings/templates/new");

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Einstellungen
        </span>
        <h1 className="mt-1 mb-6 text-2xl font-semibold tracking-tight text-foreground">
          Neues Template
        </h1>
        <TemplateForm />
      </div>
    </div>
  );
}
