"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const VALID_STAGES = ["just_arrived", "settling_in", "long_term"];

export async function setStage(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const stage = String(formData.get("stage") ?? "");
  if (!VALID_STAGES.includes(stage)) return;

  await supabase.from("profiles").update({ stage }).eq("id", user.id);
  revalidatePath("/");
}
