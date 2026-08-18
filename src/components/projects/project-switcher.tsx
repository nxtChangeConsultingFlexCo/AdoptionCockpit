"use client";

import { useRef } from "react";
import { selectProject } from "@/app/projects/actions";
import type { ProjectOption } from "@/lib/project-context";

// Spiegelt das <select>-Muster von OrgPicker (settings/org-picker.tsx),
// löst hier aber einen Server-Action-Submit statt einer Navigation aus -
// die Auswahl muss als Cookie über mehrere Seiten (Cockpit, Roadmap,
// Change-Requests) hinweg gültig bleiben, nicht nur auf einer Route.
export function ProjectSwitcher({
  projects,
  selected,
}: {
  projects: ProjectOption[];
  selected: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  if (projects.length <= 1) return null;

  return (
    <form ref={formRef} action={selectProject}>
      <select
        name="project_id"
        defaultValue={selected ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Projekt wählen"
        className="flex h-8 w-fit min-w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
    </form>
  );
}
