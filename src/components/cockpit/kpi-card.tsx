import { Card, CardContent } from "@/components/ui/card";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
}

export function KpiCard({ label, value, sublabel }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {sublabel && (
          <span className="text-sm text-muted-foreground">{sublabel}</span>
        )}
      </CardContent>
    </Card>
  );
}
