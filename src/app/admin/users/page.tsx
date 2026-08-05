export default function AdminUsersPage() {
  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-4xl">
        <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Admin
        </span>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
          Nutzer
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Die vollständige Nutzerverwaltung folgt im nächsten Schritt.
        </p>
      </div>
    </div>
  );
}
