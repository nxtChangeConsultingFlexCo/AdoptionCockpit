import Link from "next/link";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface OnboardingStep {
  label: string;
  done: boolean;
  href: string;
  actionLabel: string;
}

interface OnboardingChecklistProps {
  steps: OnboardingStep[];
}

// Rein aus vorhandenen Daten abgeleitet (siehe cockpit/page.tsx) - keine
// eigene "erledigt"-Persistenz nötig. Verschwindet von selbst, sobald
// alle Schritte erfüllt sind (siehe Aufrufer).
export function OnboardingChecklist({ steps }: OnboardingChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Erste Schritte</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                  step.done
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-transparent"
                }`}
              >
                <Check className="size-3.5" />
              </span>
              <span
                className={
                  step.done
                    ? "text-sm text-muted-foreground line-through"
                    : "text-sm text-foreground"
                }
              >
                {step.label}
              </span>
            </div>
            {!step.done && (
              <Button size="sm" variant="outline" render={<Link href={step.href} />}>
                {step.actionLabel}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
