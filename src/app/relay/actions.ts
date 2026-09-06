"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function sendRelayMessage(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const toId = String(formData.get("to_id") ?? "");
  const contextType = String(formData.get("context_type") ?? "");
  const contextId = String(formData.get("context_id") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const returnTo = String(formData.get("return_to") ?? "/");

  if (!toId || !message || toId === user.id) return;

  await supabase.from("voter_relay_messages").insert({
    from_id: user.id,
    to_id: toId,
    context_type: contextType || null,
    context_id: contextId || null,
    message: message.slice(0, 300),
  });

  revalidatePath(returnTo);
}
