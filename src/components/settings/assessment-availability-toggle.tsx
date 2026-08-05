"use client";

import { useState, useTransition } from "react";
import { setAssessmentAvailability } from "@/app/settings/assessments/actions";
import { Button } from "@/components/ui/button";

export function AssessmentAvailabilityToggle({
  organizationId,
  templateId,
  isAvailable,
}: {
  organizationId: string;
  templateId: string;
  isAvailable: boolean;
}) {
  const [available, setAvailable] = useState(isAvailable);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !available;
    setAvailable(next);
    startTransition(async () => {
      const res = await setAssessmentAvailability(organizationId, templateId, next);
      if (res.error) {
        setAvailable(!next);
      }
    });
  }

  return (
    <Button
      variant={available ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {available ? "Freigegeben" : "Ausgeblendet"}
    </Button>
  );
}
