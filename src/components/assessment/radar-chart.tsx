interface RadarAxis {
  key: string;
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  axes: RadarAxis[];
  size?: number;
}

const RING_FRACTIONS = [0.2, 0.4, 0.6, 0.8, 1];
const MAX_LABEL_CHARS_PER_LINE = 14;

// SVG-Text bricht nicht automatisch um - für mehrwortige Sektions-Labels
// (z. B. "Persönliche Eigenschaften") wird hier manuell auf max. 2 Zeilen
// umgebrochen, damit sie an den Achsen nicht über den Chart-Rand hinausragen.
function wrapLabel(label: string, maxCharsPerLine = MAX_LABEL_CHARS_PER_LINE): string[] {
  if (label.length <= maxCharsPerLine) return [label];
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Generisches Spinnennetz-/Radar-Diagramm für section_sum-Templates mit
// >=3 Sektionen: jede Achse zeigt einen Sektionswert relativ zu ihrem
// eigenen Maximum (Fragenanzahl * scale_max), Mittelpunkt = 0.
export function RadarChart({ axes, size = 360 }: RadarChartProps) {
  const center = size / 2;
  const labelPadding = 72;
  const maxRadius = center - labelPadding;
  const n = axes.length;

  function pointAt(index: number, radius: number) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / n;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  }

  function ringPolygonPoints(radius: number) {
    return Array.from({ length: n }, (_, i) => {
      const p = pointAt(i, radius);
      return `${p.x},${p.y}`;
    }).join(" ");
  }

  const dataPoints = axes.map((axis, i) => {
    const fraction = axis.max > 0 ? Math.min(1, Math.max(0, axis.value / axis.max)) : 0;
    return { ...pointAt(i, maxRadius * fraction), axis };
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Tick-Beschriftung orientiert sich am Wertebereich der ersten Achse -
  // bei einheitlicher Fragenanzahl je Sektion (Regelfall) gilt sie für
  // alle Achsen gleichermaßen.
  const referenceMax = axes[0]?.max ?? 0;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-auto w-full"
      style={{ maxWidth: size }}
      role="img"
      aria-label={`Radar-Diagramm: ${axes.map((a) => `${a.label} ${a.value}`).join(", ")}`}
    >
      {RING_FRACTIONS.map((fraction) => (
        <polygon
          key={fraction}
          points={ringPolygonPoints(maxRadius * fraction)}
          fill="none"
          className="stroke-border"
          strokeWidth={1}
        />
      ))}

      {axes.map((axis, i) => {
        const p = pointAt(i, maxRadius);
        return (
          <line
            key={axis.key}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            className="stroke-border"
            strokeWidth={1}
          />
        );
      })}

      {RING_FRACTIONS.map((fraction) => {
        const p = pointAt(0, maxRadius * fraction);
        return (
          <text
            key={fraction}
            x={p.x + 4}
            y={p.y - 4}
            className="fill-muted-foreground text-[10px]"
          >
            {Math.round(referenceMax * fraction)}
          </text>
        );
      })}

      <polygon
        points={dataPolygon}
        className="fill-primary/10 stroke-primary"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {dataPoints.map((p) => (
        <g key={p.axis.key}>
          <circle cx={p.x} cy={p.y} r={6} className="fill-card" />
          <circle cx={p.x} cy={p.y} r={4} className="fill-primary" />
        </g>
      ))}

      {dataPoints.map((p) => (
        <text
          key={`value-${p.axis.key}`}
          x={p.x}
          y={p.y - 12}
          textAnchor="middle"
          className="fill-foreground text-xs font-semibold tabular-nums"
        >
          {p.axis.value}
        </text>
      ))}

      {axes.map((axis, i) => {
        const labelPoint = pointAt(i, maxRadius + 30);
        const anchor =
          Math.abs(labelPoint.x - center) < 8
            ? "middle"
            : labelPoint.x > center
              ? "start"
              : "end";
        const lines = wrapLabel(axis.label);
        const startDy = -((lines.length - 1) * 6);
        return (
          <text
            key={axis.key}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor={anchor}
            className="fill-foreground text-xs font-medium"
          >
            {lines.map((line, lineIndex) => (
              <tspan
                key={lineIndex}
                x={labelPoint.x}
                dy={lineIndex === 0 ? startDy : 12}
              >
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
