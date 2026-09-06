"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const axis = String(formData.get("axis") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name || !axis) return;

  const { data: group, error } = await supabase
    .from("groups")
    .insert({ name, axis, description, created_by: user.id })
    .select("id")
    .single();

  if (error || !group) return;

  await supabase.from("group_members").insert({
    group_id: group.id,
    profile_id: user.id,
    role: "owner",
  });

  redirect(`/groups/${group.id}`);
}

export async function joinGroup(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("group_members").insert({ group_id: groupId, profile_id: user.id });
  redirect(`/groups/${groupId}`);
}

export async function leaveGroup(groupId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("group_members").delete().eq("group_id", groupId).eq("profile_id", user.id);
  redirect(`/groups/${groupId}`);
}
