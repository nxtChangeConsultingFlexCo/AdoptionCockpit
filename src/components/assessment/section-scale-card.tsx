import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionScaleCardProps {
  label: string;
  value: number;
  min: number;
  max: number;
  lowCaption?: string;
  highCaption?: string;
  recommendation?: string;
}

// Lineares Gegenstück zu DimensionCard für section_sum-Templates: statt
// eines auf 0-100 normalisierten Scores wird die rohe Sektionssumme auf
// ihrem eigenen Wertebereich [min, max] positioniert (z. B. 4-28 bei
// 4 Fragen auf einer 1-7-Skala).
export function SectionScaleCard({
  label,
  value,
  min,
  max,
  lowCaption = "Geringer Bedarf",
  highCaption = "Hoher Bedarf",
  recommendation,
}: SectionScaleCardProps) {
  const range = max - min;
  const percent = range > 0 ? ((value - min) / range) * 100 : 0;
  const clampedPercent = Math.min(100, Math.max(0, percent));

  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-4 space-y-0">
        <CardTitle className="text-base font-medium text-foreground">
          {label}
        </CardTitle>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{lowCaption}</span>
          <span>{highCaption}</span>
        </div>
        {recommendation && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {recommendation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
