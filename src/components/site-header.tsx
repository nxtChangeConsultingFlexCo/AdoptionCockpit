import Link from "next/link";
import { getCurrentUser, userHasRole } from "@/lib/auth/roles";
import { endImpersonation } from "@/app/impersonate/actions";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";

const navLinkClassName =
  "text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isGod = user?.role === "god";
  const canManageUsers = user ? userHasRole(user, "client_admin") : false;

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      {user?.impersonatorId && (
        <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950">
          <span>
            Mimik: {user.displayName}
          </span>
          <form action={endImpersonation}>
            <button type="submit" className="underline underline-offset-2 hover:no-underline">
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
              // keine Business-Funktionen (Assessment, Roadmap, Cockpit).
              <nav className="flex items-center gap-4">
                <Link href="/admin" className={navLinkClassName}>
                  Dashboard
                </Link>
                <Link href="/admin/users" className={navLinkClassName}>
                  Nutzer
                </Link>
                <Link href="/settings/templates" className={navLinkClassName}>
                  Templates
                </Link>
              </nav>
            ) : (
              <nav className="flex items-center gap-4">
                <Link href="/my-assessments" className={navLinkClassName}>
                  Meine Assessments
                </Link>
                <Link href="/cockpit" className={navLinkClassName}>
                  Cockpit
                </Link>
                <Link href="/roadmap" className={navLinkClassName}>
                  Roadmap
                </Link>
                <Link href="/change-requests" className={navLinkClassName}>
                  Ideen &amp; Anfragen
                </Link>
                <Link href="/settings/team" className={navLinkClassName}>
                  Mein Team
                </Link>
                {canManageUsers && (
                  <>
                    <Link href="/settings/users" className={navLinkClassName}>
                      Nutzer
                    </Link>
                    <Link
                      href="/settings/assignments"
                      className={navLinkClassName}
                    >
                      Zuordnungen
                    </Link>
                    <Link
                      href="/settings/assessments"
                      className={navLinkClassName}
                    >
                      Assessments verwalten
                    </Link>
                  </>
                )}
              </nav>
            )}
            <UserMenu
              displayName={user.displayName}
              email={user.email}
              isGod={isGod}
              canManageUsers={canManageUsers}
            />
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
