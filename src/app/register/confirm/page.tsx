export default function RegisterConfirmPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Fast geschafft
        </h1>
        <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Wir haben dir eine E-Mail zur Bestätigung deines Kontos geschickt.
          Bitte bestätige deine E-Mail-Adresse und melde dich anschließend an,
          um dein Assessment-Ergebnis zu sehen.
        </p>
      </main>
    </div>
  );
}
