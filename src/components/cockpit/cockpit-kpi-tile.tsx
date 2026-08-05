import Link from "next/link";

export function CockpitKpiTile({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-1.5 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40"
    >
      <span className="text-3xl font-semibold tabular-nums text-foreground">
        {value}
      </span>
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
    </Link>
  );
}
