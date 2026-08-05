import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          KI-Readiness-Assessment
        </h1>
        <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Finden Sie in wenigen Minuten heraus, wie bereit Ihr Unternehmen
          für den Einsatz von Künstlicher Intelligenz ist. Wir bewerten
          Datenqualität, Prozessklarheit, kulturelle Akzeptanz sowie
          Governance &amp; Compliance und geben Ihnen konkrete
          Handlungsempfehlungen.
        </p>
        <Button size="lg" render={<Link href="/assessment" />}>
          Assessment starten
        </Button>
      </main>
    </div>
  );
}
