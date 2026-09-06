import { SupabaseClient } from "@supabase/supabase-js";

export type TrustPathNode = { id: string; name: string };

// BFS over the vouch graph (voucher_id -> vouchee_id) to find the shortest
// chain of vouches from `fromId` to `toId` — "You → Maria → Priya". Fetches
// the whole edge list once; fine at MVP scale, revisit if the vouch graph
// grows large.
export async function findVouchPath(
  supabase: SupabaseClient,
  fromId: string,
  toId: string,
  maxDepth = 4,
): Promise<TrustPathNode[] | null> {
  if (fromId === toId) return null;

  const { data: edges } = await supabase.from("vouches").select("voucher_id, vouchee_id");
  if (!edges || edges.length === 0) return null;

  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    const list = adjacency.get(e.voucher_id) ?? [];
    list.push(e.vouchee_id);
    adjacency.set(e.voucher_id, list);
  }

  const visited = new Set([fromId]);
  const queue: string[][] = [[fromId]];

  while (queue.length > 0) {
    const path = queue.shift()!;
    if (path.length > maxDepth) continue;
    const last = path[path.length - 1];

    for (const next of adjacency.get(last) ?? []) {
      if (next === toId) {
        const fullIds = [...path, next];
        return resolveNames(supabase, fullIds);
      }
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }

  return null;
}

async function resolveNames(supabase: SupabaseClient, ids: string[]): Promise<TrustPathNode[]> {
  const { data } = await supabase.from("profiles").select("id, name").in("id", ids);
  const byId = new Map((data ?? []).map((p) => [p.id, p.name as string]));
  return ids.map((id) => ({ id, name: byId.get(id) ?? "Someone" }));
}

export async function isWithinVouchRange(
  supabase: SupabaseClient,
  fromId: string,
  toId: string,
  maxDepth = 3,
): Promise<boolean> {
  if (fromId === toId) return false;
  const path = await findVouchPath(supabase, fromId, toId, maxDepth);
  return path !== null;
}

// For CTAs that need to check many candidates at once (e.g. "which of these
// voters can I reach?") — one BFS instead of one findVouchPath call per
// candidate.
export async function reachableWithinRange(
  supabase: SupabaseClient,
  fromId: string,
  maxDepth = 3,
): Promise<Set<string>> {
  const { data: edges } = await supabase.from("vouches").select("voucher_id, vouchee_id");
  const reachable = new Set<string>();
  if (!edges || edges.length === 0) return reachable;

  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    const list = adjacency.get(e.voucher_id) ?? [];
    list.push(e.vouchee_id);
    adjacency.set(e.voucher_id, list);
  }

  let frontier = [fromId];
  const visited = new Set([fromId]);
  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          reachable.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }

  return reachable;
}
