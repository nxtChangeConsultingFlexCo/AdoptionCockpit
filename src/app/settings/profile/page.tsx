import { requireUser } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";

export default async function ProfilePage() {
  const currentUser = await requireUser("/settings/profile");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, phone")
    .eq("id", currentUser.id)
    .maybeSingle();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="flex w-full max-w-xl flex-col gap-10">
        <div>
          <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Einstellungen
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Mein Profil
          </h1>
        </div>

        <section className="flex flex-col gap-4">
          <ProfileForm
            email={currentUser.email}
            initialFirstName={profile?.first_name ?? ""}
            initialLastName={profile?.last_name ?? ""}
            initialPhone={profile?.phone ?? ""}
          />
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <h2 className="text-lg font-medium text-foreground">Passwort</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
