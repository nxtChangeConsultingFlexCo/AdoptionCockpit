import type { AppRole } from "./roles";

export const COCKPIT_KPI_IDS = [
  "checks_pending",
  "checks_completed",
  "requests_unhandled",
  "requests_in_progress",
  "requests_done",
  "requests_on_roadmap",
] as const;

export type CockpitKpiId = (typeof COCKPIT_KPI_IDS)[number];

export const COCKPIT_KPI_LABELS: Record<CockpitKpiId, string> = {
  checks_pending: "Ausstehende Checks",
  checks_completed: "Erledigte Checks",
  requests_unhandled: "Unbehandelte Anfragen",
  requests_in_progress: "In Behandlung",
  requests_done: "Erledigte Anfragen",
  requests_on_roadmap: "Auf der Roadmap",
};

export const COCKPIT_KPI_HREFS: Record<CockpitKpiId, string> = {
  checks_pending: "/",
  checks_completed: "/my-assessments",
  requests_unhandled: "/change-requests?status=submitted",
  requests_in_progress: "/change-requests?status=in_progress",
  requests_done: "/change-requests?status=done",
  requests_on_roadmap: "/roadmap",
};

// Schlankes Default-Set, falls eine Rolle in
// organizations.cockpit_kpi_visibility noch nicht konfiguriert wurde.
export const DEFAULT_COCKPIT_KPI_IDS: CockpitKpiId[] = [
  "checks_pending",
  "requests_unhandled",
];

// Rollen, die client_admin einzeln freischalten kann. client_admin und
// god sehen immer alle KPIs und sind daher hier bewusst ausgenommen.
export const CONFIGURABLE_COCKPIT_ROLES: AppRole[] = [
  "employee",
  "leader",
  "ca_board",
  "it_board",
  "steering_committee",
];

export type CockpitKpiVisibilityConfig = Partial<Record<string, string[]>>;

export function resolveVisibleKpis(
  isAdmin: boolean,
  orgRoles: AppRole[],
  config: CockpitKpiVisibilityConfig | null | undefined,
): CockpitKpiId[] {
  if (isAdmin) return [...COCKPIT_KPI_IDS];

  const rolesToCheck = orgRoles.length > 0 ? orgRoles : ["employee"];
  const enabled = new Set<CockpitKpiId>();

  for (const role of rolesToCheck) {
    const ids = config?.[role] ?? DEFAULT_COCKPIT_KPI_IDS;
    for (const id of ids) {
      if ((COCKPIT_KPI_IDS as readonly string[]).includes(id)) {
        enabled.add(id as CockpitKpiId);
      }
    }
  }

  return COCKPIT_KPI_IDS.filter((id) => enabled.has(id));
}
