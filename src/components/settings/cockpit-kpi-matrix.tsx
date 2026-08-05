"use client";

import { useState, useTransition } from "react";
import { updateCockpitKpiVisibility } from "@/app/settings/cockpit/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { APP_ROLE_LABELS, type AppRole } from "@/types/roles";
import {
  COCKPIT_KPI_IDS,
  COCKPIT_KPI_LABELS,
  CONFIGURABLE_COCKPIT_ROLES,
  type CockpitKpiId,
} from "@/types/cockpit";

export function CockpitKpiMatrix({
  organizationId,
  initialConfig,
}: {
  organizationId: string;
  initialConfig: Record<AppRole, CockpitKpiId[]>;
}) {
  const [config, setConfig] =
    useState<Record<AppRole, CockpitKpiId[]>>(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(role: AppRole, kpiId: CockpitKpiId, checked: boolean) {
    const previous = config[role];
    const next = checked
      ? [...previous, kpiId]
      : previous.filter((id) => id !== kpiId);

    setConfig((prev) => ({ ...prev, [role]: next }));
    setError(null);
    startTransition(async () => {
      const res = await updateCockpitKpiVisibility(organizationId, role, next);
      if (res.error) {
        setConfig((prev) => ({ ...prev, [role]: previous }));
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3">KPI</th>
                {CONFIGURABLE_COCKPIT_ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 text-center">
                    {APP_ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COCKPIT_KPI_IDS.map((kpiId) => (
                <tr key={kpiId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-foreground">
                    {COCKPIT_KPI_LABELS[kpiId]}
                  </td>
                  {CONFIGURABLE_COCKPIT_ROLES.map((role) => (
                    <td key={role} className="px-4 py-3 text-center">
                      <Checkbox
                        checked={config[role]?.includes(kpiId) ?? false}
                        disabled={isPending}
                        onCheckedChange={(checked) =>
                          toggle(role, kpiId, checked === true)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
