"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function postIntel(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const category = String(formData.get("category") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  if (!category || !label || !value) return;

  await supabase.from("intel_items").insert({ category, label, value, author_id: user.id });
  revalidatePath("/");
}
