import { cn } from "@/lib/utils";
import {
  CHANGE_REQUEST_STATUS_LABELS,
  type ChangeRequestStatus,
} from "@/types/governance";

const STATUS_STYLES: Record<ChangeRequestStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary/10 text-primary",
  cab_review: "bg-primary/10 text-primary",
  qualified: "bg-primary/10 text-primary",
  it_backlog: "bg-primary/10 text-primary",
  in_implementation: "bg-primary text-primary-foreground",
  done: "bg-muted text-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

export function StatusBadge({ status }: { status: ChangeRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
      )}
    >
      {CHANGE_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
