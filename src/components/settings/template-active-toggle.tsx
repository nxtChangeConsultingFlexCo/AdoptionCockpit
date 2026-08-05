"use client";

import { useState, useTransition } from "react";
import { toggleTemplateActive } from "@/app/settings/templates/actions";
import { Button } from "@/components/ui/button";

export function TemplateActiveToggle({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const res = await toggleTemplateActive(id, next);
      if (res.error) {
        setActive(!next);
      }
    });
  }

  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {active ? "Aktiv" : "Inaktiv"}
    </Button>
  );
}
