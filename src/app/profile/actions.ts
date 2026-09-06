"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function vouchFor(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const voucheeId = String(formData.get("vouchee_id") ?? "");
  if (!voucheeId || voucheeId === user.id) return;

  await supabase.from("vouches").insert({ voucher_id: user.id, vouchee_id: voucheeId });
  revalidatePath(`/profile/${voucheeId}`);
}
