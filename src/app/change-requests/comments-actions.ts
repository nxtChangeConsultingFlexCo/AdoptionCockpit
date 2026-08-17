"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/roles";

export interface CommentActionResult {
  error?: string;
}

export async function addComment(
  requestId: string,
  body: string,
): Promise<CommentActionResult> {
  const user = await requireUser(`/change-requests/${requestId}`);
  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Bitte einen Kommentar eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("change_request_comments").insert({
    change_request_id: requestId,
    author_id: user.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  revalidatePath(`/change-requests/${requestId}`);
  return {};
}
