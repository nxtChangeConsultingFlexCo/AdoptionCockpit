import { requireRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { CockpitKpiMatrix } from "@/components/settings/cockpit-kpi-matrix";
import {
  CONFIGURABLE_COCKPIT_ROLES,
  DEFAULT_COCKPIT_KPI_IDS,
  type CockpitKpiId,
  type CockpitKpiVisibilityConfig,
} from "@/types/cockpit";
import type { AppRole } from "@/types/roles";

export default async function CockpitSettingsPage() {
  const currentUser = await requireRole(["client_admin"], "/settings/cockpit");
  const organizationId = currentUser.organizationId;
  const supabase = await createClient();

  let resolvedConfig = {} as Record<AppRole, CockpitKpiId[]>;

  if (organizationId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("cockpit_kpi_visibility")
      .eq("id", organizationId)
      .maybeSingle();

    const raw = (org?.cockpit_kpi_visibility ?? {}) as CockpitKpiVisibilityConfig;
    resolvedConfig = Object.fromEntries(
      CONFIGURABLE_COCKPIT_ROLES.map((role) => [
        role,
        (raw[role] as CockpitKpiId[] | undefined) ?? DEFAULT_COCKPIT_KPI_IDS,
      ]),
    ) as Record<AppRole, CockpitKpiId[]>;
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Einstellungen
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Cockpit-KPIs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lege pro Rolle fest, welche Kennzahlen im Cockpit sichtbar sind.
            Nicht angehakte KPIs erscheinen bei dieser Rolle nicht.
            Organisations-Admin und Platform-Owner sehen immer alle KPIs.
          </p>
        </div>

        {!organizationId ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
            Keiner Organisation zugeordnet.
          </div>
        ) : (
          <CockpitKpiMatrix
            organizationId={organizationId}
            initialConfig={resolvedConfig}
          />
        )}
      </div>
    </div>
  );
}
