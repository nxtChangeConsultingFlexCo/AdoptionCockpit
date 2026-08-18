import Link from "next/link";
import { requireUser, userHasRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  PROGRAM_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  type ProgramRow,
  type ProjectRow,
} from "@/types/project";

export default async function ProjectsPage() {
  const user = await requireUser("/projects");
  const canManage = user.role === "god" || userHasRole(user, "client_admin");
  const supabase = await createClient();

  // RLS beschränkt beide Abfragen bereits auf die eigene Organisation
  // (bzw. alles für god).
  const [{ data: projectData }, { data: programData }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: true }),
    supabase.from("programs").select("*").order("created_at", { ascending: true }),
  ]);

  const projects = (projectData ?? []) as ProjectRow[];
  const programs = (programData ?? []) as ProgramRow[];
  const programsById = new Map(programs.map((p) => [p.id, p]));

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Struktur
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Projekte
            </h1>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" render={<Link href="/programs/new" />}>
                Neues Programm
              </Button>
              <Button render={<Link href="/projects/new" />}>Neues Projekt</Button>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Noch keine Projekte vorhanden.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => {
              const program = project.program_id
                ? programsById.get(project.program_id)
                : null;
              return (
                <div
                  key={project.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">
                      {project.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {program ? `Programm: ${program.name}` : "Kein Programm"}
                      {project.phase ? ` · Phase: ${project.phase}` : ""}
                    </span>
                    {project.goal && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {project.goal}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/projects/${project.id}`} />}
                      >
                        Mitglieder
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {programs.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">Programme</h2>
            <div className="flex flex-col gap-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">
                      {program.name}
                    </span>
                    {program.goal && (
                      <p className="text-sm text-muted-foreground">{program.goal}</p>
                    )}
                  </div>
                  <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                    {PROGRAM_STATUS_LABELS[program.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
