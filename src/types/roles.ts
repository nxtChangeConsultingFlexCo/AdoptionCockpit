export const APP_ROLES = [
  "god",
  "consultant",
  "client_admin",
  "employee",
  "leader",
  "cab_member",
  "it_board",
  "steering_committee",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  god: "Platform-Owner",
  consultant: "Consultant",
  client_admin: "Organisations-Admin",
  employee: "Mitarbeiter",
  leader: "Cluster Lead",
  cab_member: "CAB-Mitglied",
  it_board: "IT Board",
  steering_committee: "Steering Committee",
};

// Rollen, die ein client_admin/god innerhalb der Benutzerverwaltung einer
// Organisation vergeben kann. "god" ist plattformweit und wird nie über
// die normale Benutzerverwaltung vergeben.
export const ASSIGNABLE_ORG_ROLES: AppRole[] = [
  "employee",
  "leader",
  "cab_member",
  "it_board",
  "steering_committee",
  "client_admin",
];
