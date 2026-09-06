"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function toggleChecklistItem(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const itemKey = String(formData.get("item_key") ?? "");
  const isDone = String(formData.get("is_done") ?? "") === "true";
  if (!itemKey) return;

  if (isDone) {
    await supabase.from("checklist_progress").delete().eq("profile_id", user.id).eq("item_key", itemKey);
  } else {
    await supabase.from("checklist_progress").insert({ profile_id: user.id, item_key: itemKey });
  }

  revalidatePath("/");
}
