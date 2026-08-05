"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionResult {
  error?: string;
}

export async function updateProfile(
  firstName: string,
  lastName: string,
  phone: string,
): Promise<ProfileActionResult> {
  if (!firstName.trim() || !lastName.trim()) {
    return { error: "Vorname und Nachname dürfen nicht leer sein." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/profile");
  return {};
}

export async function changePassword(
  newPassword: string,
): Promise<ProfileActionResult> {
  if (newPassword.length < 8) {
    return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { error: error.message };

  return {};
}
