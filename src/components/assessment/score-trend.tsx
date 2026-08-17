export interface ScoreTrendPoint {
  date: string;
  score: number;
}

interface ScoreTrendProps {
  points: ScoreTrendPoint[];
  min: number;
  max: number;
}

// Einfache, selbst gezeichnete SVG-Polyline (analog zum Hand-Roll-Stil von
// radar-chart.tsx/radial-score.tsx, keine neue Chart-Bibliothek), plus eine
// Tabellen-Zwillingsansicht darunter für Zugänglichkeit. Zeigt, wie sich
// derselbe Check über wiederholte Durchläufe entwickelt hat.
export function ScoreTrend({ points, min, max }: ScoreTrendProps) {
  const width = 480;
  const height = 120;
  const padding = 24;
  const range = max - min || 1;

  function xAt(index: number): number {
    return points.length <= 1
      ? width / 2
      : padding + (index / (points.length - 1)) * (width - padding * 2);
  }
  function yAt(score: number): number {
    const fraction = Math.min(1, Math.max(0, (score - min) / range));
    return height - padding - fraction * (height - padding * 2);
  }

  const linePoints = points.map((p, i) => `${xAt(i)},${yAt(p.score)}`).join(" ");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Verlauf</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Verlauf: ${points.map((p) => `${p.date} ${p.score}`).join(", ")}`}
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className="stroke-border"
          strokeWidth={1}
        />
        <polyline
          points={linePoints}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(p.score)} r={4} className="fill-primary" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {points.map((p, i) => (
          <span key={i}>
            {p.date}: <span className="font-medium text-foreground">{p.score}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
