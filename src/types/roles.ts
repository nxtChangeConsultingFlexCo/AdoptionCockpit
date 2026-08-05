export const APP_ROLES = ["god", "consultant", "client_admin", "client_user"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  god: "Platform-Owner",
  consultant: "Consultant",
  client_admin: "Organisations-Admin",
  client_user: "Nutzer",
};
