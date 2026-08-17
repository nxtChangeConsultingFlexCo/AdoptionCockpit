export const APP_ROLES = [
  "god",
  "consultant",
  "client_admin",
  "employee",
  "leader",
  "ca_board",
  "it_board",
  "steering_committee",
  "change_agent",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  god: "Platform-Owner",
  consultant: "Consultant",
  client_admin: "Organisations-Admin",
  employee: "Mitarbeiter",
  leader: "Cluster Lead",
  ca_board: "CA Board",
  it_board: "IT Board",
  steering_committee: "Steering Committee (Aufsicht)",
  change_agent: "Change Agent",
};

// Rollen, die ein client_admin/god innerhalb der Benutzerverwaltung einer
// Organisation vergeben kann. "god" ist plattformweit und wird nie über
// die normale Benutzerverwaltung vergeben. change_agent ist rein
// deskriptiv (keine eigenen Berechtigungen) - für informelle
// Multiplikator:innen/Key User, die in Handlungsempfehlungen mehrerer
// Checks erwähnt werden, aber bislang nirgends nominiert werden konnten.
export const ASSIGNABLE_ORG_ROLES: AppRole[] = [
  "employee",
  "leader",
  "ca_board",
  "it_board",
  "steering_committee",
  "client_admin",
  "change_agent",
];
