import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase leitet nach E-Mail-Bestätigung/Magic-Link hierher um
// (?code=...). Der Code muss server-seitig gegen eine echte Session
// eingetauscht werden (PKCE-Flow) - ohne diesen Handler landet der
// Code unverarbeitet als Query-Param auf der Zielseite und der Nutzer
// bleibt ausgeloggt.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/assessment";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Bestätigung fehlgeschlagen. Bitte melde dich an oder versuche es erneut.",
    )}`,
  );
}
