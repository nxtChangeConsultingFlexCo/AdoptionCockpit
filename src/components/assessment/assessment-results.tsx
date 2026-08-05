import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ASSESSMENT_DIMENSIONS,
  ASSESSMENT_DIMENSION_LABELS,
  type AssessmentScores,
} from "@/types/assessment";

interface AssessmentResultsProps {
  scores: AssessmentScores;
  totalScore: number;
}

export function AssessmentResults({ scores, totalScore }: AssessmentResultsProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Dein KI-Readiness-Ergebnis
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Gesamt-Score: <span className="font-semibold">{totalScore} / 100</span>
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {ASSESSMENT_DIMENSIONS.map((dimension) => (
          <div key={dimension} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {ASSESSMENT_DIMENSION_LABELS[dimension]}
              </span>
              <span className="text-zinc-500 dark:text-zinc-500">
                {scores[dimension]} / 100
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                style={{ width: `${scores[dimension]}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Dein Ergebnis wurde gespeichert. Wir melden uns mit konkreten
        Handlungsempfehlungen für dein Unternehmen bei dir.
      </p>

      <Button variant="outline" render={<Link href="/" />} className="self-start">
        Zurück zur Startseite
      </Button>
    </div>
  );
}
