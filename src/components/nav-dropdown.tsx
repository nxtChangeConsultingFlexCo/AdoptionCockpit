"use client";

import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLinkItem,
} from "@/components/ui/dropdown-menu";

interface NavDropdownItem {
  href: string;
  label: string;
}

export function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: NavDropdownItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-zinc-600 outline-none transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50">
        {label}
        <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10}>
        {items.map((item) => (
          <DropdownMenuLinkItem
            key={item.href}
            closeOnClick
            render={<Link href={item.href} />}
          >
            {item.label}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
