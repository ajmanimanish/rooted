import { redirect } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

export async function requireUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function fetchUserGroups(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("group_members")
    .select("groups(id, name)")
    .eq("profile_id", userId);
  type GroupRef = { id: string; name: string };
  return (data ?? [])
    .map((m) => m.groups as unknown as GroupRef | null)
    .filter((g): g is GroupRef => Boolean(g));
}
