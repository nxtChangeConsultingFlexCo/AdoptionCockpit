import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectMembersList } from "@/components/projects/project-members-list";
import { PROJECT_STATUS_LABELS, type ProjectRow } from "@/types/project";

interface MemberOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["god", "client_admin"], "/projects");
  const { id } = await params;
  const supabase = await createClient();

  // RLS ("Org members can view their organization's projects") lässt
  // client_admin/god hier ohnehin nur ihre eigenen bzw. alle Projekte
  // sehen - kein zusätzlicher Org-Filter nötig.
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();
  const typedProject = project as ProjectRow;

  const [{ data: memberData }, { data: membershipData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("organization_id", typedProject.organization_id)
      .order("first_name", { ascending: true }),
    supabase.from("project_members").select("user_id").eq("project_id", id),
  ]);

  const orgMembers = (memberData ?? []) as MemberOption[];
  const memberIds = new Set((membershipData ?? []).map((m) => m.user_id as string));

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Projekt
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {typedProject.name}
            </h1>
          </div>
          <Button variant="ghost" render={<Link href="/projects" />}>
            Zurück zur Liste
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mitglieder</CardTitle>
            <CardDescription>
              Nur Mitglieder (und client_admin/god) sehen dieses Projekt sowie
              seine Change Requests und Roadmap-Einträge. Was ein Mitglied
              damit tun darf, kommt weiterhin aus seiner Org-Rolle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectMembersList
              projectId={typedProject.id}
              members={orgMembers.map((m) => ({
                id: m.id,
                name:
                  [m.first_name, m.last_name].filter(Boolean).join(" ") ||
                  m.email ||
                  "Unbekannt",
                isMember: memberIds.has(m.id),
              }))}
            />
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Status: {PROJECT_STATUS_LABELS[typedProject.status]}
          {typedProject.phase ? ` · Phase: ${typedProject.phase}` : ""}
        </p>
      </div>
    </div>
  );
}
