import { requireUser } from "@/lib/auth/roles";
import { ROADMAP_PHASES } from "@/data/roadmap-phases";
import { Button } from "@/components/ui/button";

export default async function RoadmapPage() {
  await requireUser("/roadmap");

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Deine Roadmap
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Von der Standortbestimmung zur Umsetzung
          </h1>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
            Sobald dein persönlicher Deep-Dive abgeschlossen ist, erscheinen
            hier deine priorisierten Maßnahmen. So ist der Weg grundsätzlich
            aufgebaut:
          </p>
        </div>

        <ol className="mt-14 flex flex-col gap-10">
          {ROADMAP_PHASES.map((phase, index) => (
            <li key={phase.id} className="relative flex gap-6">
              <div className="flex flex-col items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-foreground">
                  {index + 1}
                </span>
                {index < ROADMAP_PHASES.length - 1 && (
                  <span className="mt-2 w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 pb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">
                    {phase.title}
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {phase.timeframe}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {phase.description}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {phase.focus.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Bereit für deinen Deep-Dive?
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            In einem persönlichen Gespräch priorisieren wir diese Phasen
            konkret für dein Unternehmen.
          </p>
          <Button size="lg" disabled>
            Deep-Dive anfragen — bald verfügbar
          </Button>
        </div>
      </div>
    </div>
  );
}
