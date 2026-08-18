import Link from "next/link";
import { getCurrentUser, userHasRole } from "@/lib/auth/roles";
import { endImpersonation } from "@/app/impersonate/actions";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { NavDropdown } from "@/components/nav-dropdown";

const navLinkClassName =
  "text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

const BOARD_ROLES = ["leader", "ca_board", "it_board", "steering_committee"] as const;

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isGod = user?.role === "god";
  const isClientAdmin = user ? userHasRole(user, "client_admin") : false;
  const isSteering = user ? userHasRole(user, "steering_committee") : false;
  const hasBoardRole = user
    ? BOARD_ROLES.some((role) => userHasRole(user, role))
    : false;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      {user?.impersonatorId && (
        <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950">
          <span>Mimik: {user.displayName}</span>
          <form action={endImpersonation}>
            <button
              type="submit"
              className="underline underline-offset-2 hover:no-underline"
            >
              Beenden
            </button>
          </form>
        </div>
      )}
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link
          href={isGod ? "/admin" : "/"}
          className="font-semibold text-zinc-950 dark:text-zinc-50"
        >
          AdoptionCockpit
        </Link>
        {user ? (
          <div className="flex items-center gap-5 text-sm">
            {isGod ? (
              // god ist Plattform-Admin, kein Enduser: nur der Admin-Bereich,
              // keine Business-Funktionen (Cockpit, Roadmap, Checks nehmen).
              <nav className="flex items-center gap-4">
                <Link href="/admin" className={navLinkClassName}>
                  Dashboard
                </Link>
                <NavDropdown
                  label="Benutzerverwaltung"
                  items={[
                    { href: "/admin/users", label: "Nutzer" },
                    { href: "/admin/organizations", label: "Organisationen" },
                  ]}
                />
                <Link href="/settings/templates" className={navLinkClassName}>
                  Check-Templates
                </Link>
              </nav>
            ) : (
              <nav className="flex items-center gap-4">
                <Link href="/cockpit" className={navLinkClassName}>
                  Cockpit
                </Link>
                <Link href="/roadmap" className={navLinkClassName}>
                  Roadmap
                </Link>
                <Link href="/projects" className={navLinkClassName}>
                  Projekte
                </Link>
                {isClientAdmin ? (
                  <NavDropdown
                    label="Checks"
                    items={[
                      { href: "/my-assessments", label: "Meine Checks" },
                      {
                        href: "/settings/assessments",
                        label: "Checks verwalten",
                      },
                    ]}
                  />
                ) : (
                  <Link
                    href={
                      isSteering
                        ? "/settings/assessments#ergebnisse"
                        : "/my-assessments"
                    }
                    className={navLinkClassName}
                  >
                    {hasBoardRole ? "Checks" : "Meine Checks"}
                  </Link>
                )}
                {isClientAdmin && (
                  <NavDropdown
                    label="Organisation"
                    items={[
                      { href: "/settings/users", label: "Nutzer" },
                      { href: "/settings/assignments", label: "Zuordnungen" },
                      { href: "/settings/cockpit", label: "Cockpit-KPIs" },
                      { href: "/sponsor", label: "Sponsor-Ansicht" },
                    ]}
                  />
                )}
                {isSteering && !isClientAdmin && (
                  <Link href="/sponsor" className={navLinkClassName}>
                    Sponsor-Ansicht
                  </Link>
                )}
              </nav>
            )}
            <UserMenu displayName={user.displayName} email={user.email} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Anmelden
            </Button>
            <Button size="sm" render={<Link href="/register" />}>
              Registrieren
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
