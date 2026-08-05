"use client";

import { useRouter } from "next/navigation";

export function OrgPicker({
  organizations,
  selected,
}: {
  organizations: { id: string; name: string }[];
  selected: string | null;
}) {
  const router = useRouter();

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => router.push(`/settings/assignments?org=${e.target.value}`)}
      className="flex h-8 w-fit min-w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
