export interface MatrixAxisValue {
  score: number;
  min: number;
  max: number;
}

interface NeedCapabilityMatrixProps {
  need: MatrixAxisValue | null;
  capability: MatrixAxisValue | null;
}

const SIZE = 220;

// Stellt das jeweils neueste Ergebnis des "Change-Management-Bedarf"- und
// des "Organisations-Change-Fähigkeiten"-Checks als 2x2-Quadrant dar -
// genau die Kombination, die die Auswertungstexte beider Checks bereits
// empfehlen, aber bislang nirgends automatisch berechnet wird. Slug-
// basierte Kopplung bewusst hart codiert (siehe src/app/sponsor/page.tsx).
export function NeedCapabilityMatrix({ need, capability }: NeedCapabilityMatrixProps) {
  if (!need || !capability) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Für diese Ansicht müssen sowohl der Check „Change-Management-Bedarf“
        als auch der Check „Change-Fähigkeiten der Organisation“ mindestens
        einmal abgeschlossen sein.
      </div>
    );
  }

  const needPct = Math.min(
    100,
    Math.max(0, ((need.score - need.min) / (need.max - need.min || 1)) * 100),
  );
  const capPct = Math.min(
    100,
    Math.max(0, ((capability.score - capability.min) / (capability.max - capability.min || 1)) * 100),
  );
  const dotX = (capPct / 100) * SIZE;
  const dotY = SIZE - (needPct / 100) * SIZE;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible">
          <rect
            x={0}
            y={0}
            width={SIZE}
            height={SIZE}
            fill="none"
            className="stroke-border"
            strokeWidth={1}
          />
          <line
            x1={SIZE / 2}
            y1={0}
            x2={SIZE / 2}
            y2={SIZE}
            className="stroke-border"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={SIZE / 2}
            x2={SIZE}
            y2={SIZE / 2}
            className="stroke-border"
            strokeWidth={1}
          />
          <circle cx={dotX} cy={dotY} r={6} className="fill-primary" />
        </svg>
        <span className="absolute top-0 left-0 -translate-y-full text-[10px] text-muted-foreground">
          Hoher Bedarf
        </span>
        <span className="absolute bottom-0 left-0 translate-y-full text-[10px] text-muted-foreground">
          Geringer Bedarf
        </span>
        <span className="absolute right-0 bottom-0 translate-y-full text-[10px] text-muted-foreground">
          Hohe Fähigkeit →
        </span>
      </div>
      <div className="flex flex-col justify-center gap-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Bedarf × Fähigkeit:</span>{" "}
          zeigt, wie viel Change-Management-Bedarf euer Projekt hat im
          Verhältnis zu den organisatorischen Fähigkeiten, die ihr dafür
          bereits mitbringt.
        </p>
        <p>
          Oben links (hoher Bedarf, geringe Fähigkeit) ist die Risikozone –
          hier lohnt sich zusätzliche Change-Management-Unterstützung am
          meisten.
        </p>
      </div>
    </div>
  );
}
