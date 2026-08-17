import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DimensionCardProps {
  label: string;
  score: number;
  recommendation?: string;
  benchmarkScore?: number;
}

export function DimensionCard({
  label,
  score,
  recommendation,
  benchmarkScore,
}: DimensionCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-4 space-y-0">
        <CardTitle className="text-base font-medium text-foreground">
          {label}
        </CardTitle>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {score}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${score}%` }}
          />
          {typeof benchmarkScore === "number" && (
            <div
              className="absolute inset-y-0 w-0.5 bg-foreground/50"
              style={{ left: `${benchmarkScore}%` }}
              title={`Median: ${benchmarkScore}`}
            />
          )}
        </div>
        {recommendation && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {recommendation}
          </p>
        )}
        {typeof benchmarkScore === "number" && (
          <p className="text-xs text-muted-foreground">
            Vergleich (Median): {benchmarkScore}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
