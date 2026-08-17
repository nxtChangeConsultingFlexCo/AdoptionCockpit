"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { logout } from "@/lib/auth-actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLinkItem,
} from "@/components/ui/dropdown-menu";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

interface UserMenuProps {
  displayName: string;
  email: string | null;
}

export function UserMenu({ displayName, email }: UserMenuProps) {
  const [isPending, startTransition] = useTransition();
  const { resolvedTheme, setTheme } = useTheme();
  // Vor dem ersten Client-Mount ist resolvedTheme unbekannt (next-themes
  // liest die Präferenz erst nach Hydration) - bis dahin einen neutralen
  // Zustand zeigen, um einen Hydration-Mismatch zu vermeiden.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar>
          <AvatarFallback>{initials(displayName)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          {email && <p className="text-xs text-muted-foreground">{email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLinkItem closeOnClick render={<Link href="/settings/profile" />}>
          Einstellungen
        </DropdownMenuLinkItem>
        <DropdownMenuLinkItem closeOnClick render={<Link href="/settings/team" />}>
          Mein Team
        </DropdownMenuLinkItem>
        <DropdownMenuItem
          closeOnClick={false}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="gap-2"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {isDark ? "Helles Design" : "Dunkles Design"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          closeOnClick
          disabled={isPending}
          onClick={() => startTransition(() => logout())}
        >
          Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
