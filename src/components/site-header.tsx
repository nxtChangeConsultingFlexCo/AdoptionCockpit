import Link from "next/link";
import { getCurrentUser, userHasRole } from "@/lib/auth/roles";
import { logout } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const canManageUsers = user ? userHasRole(user, "client_admin") || user.role === "god" : false;
  const isGod = user?.role === "god";

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="font-semibold text-zinc-950 dark:text-zinc-50"
        >
          AdoptionCockpit
        </Link>
        {user ? (
          <div className="flex items-center gap-5 text-sm">
            <nav className="flex items-center gap-4">
              <Link
                href="/cockpit"
                className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Cockpit
              </Link>
              <Link
                href="/roadmap"
                className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Roadmap
              </Link>
              <Link
                href="/change-requests"
                className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Ideen &amp; Anfragen
              </Link>
              {canManageUsers && (
                <Link
                  href="/settings/users"
                  className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Nutzer
                </Link>
              )}
              {isGod && (
                <Link
                  href="/settings/templates"
                  className="text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Templates
                </Link>
              )}
            </nav>
            <span className="hidden text-zinc-600 sm:inline dark:text-zinc-400">
              {user.email}
            </span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                Abmelden
              </Button>
            </form>
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
