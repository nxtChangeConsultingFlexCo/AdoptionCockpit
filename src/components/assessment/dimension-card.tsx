import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSESSMENT_DIMENSION_LABELS, type AssessmentDimension } from "@/types/assessment";
import { DIMENSION_ASSESSMENTS, getReadinessTier } from "@/data/result-copy";

interface DimensionCardProps {
  dimension: AssessmentDimension;
  score: number;
}

export function DimensionCard({ dimension, score }: DimensionCardProps) {
  const tier = getReadinessTier(score);

  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-4 space-y-0">
        <CardTitle className="text-base font-medium text-foreground">
          {ASSESSMENT_DIMENSION_LABELS[dimension]}
        </CardTitle>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {score}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {DIMENSION_ASSESSMENTS[dimension][tier]}
        </p>
      </CardContent>
    </Card>
  );
}
