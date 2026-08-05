"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/roadmap", label: "Plan" },
  { href: "/change-requests", label: "Anfragen" },
] as const;

export function RoadmapTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 border-b border-border">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/roadmap"
            ? pathname === "/roadmap"
            : pathname.startsWith("/change-requests");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
