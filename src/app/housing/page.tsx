import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { fetchTrustedItemIds, NEVER_EMPTY_THRESHOLD } from "@/lib/items";
import EmptyState from "@/components/EmptyState";
import TrustedToggle from "@/components/TrustedToggle";
import WidenedScopeBanner from "@/components/WidenedScopeBanner";

const KIND_LABEL: Record<string, string> = {
  available: "Available",
  seeking: "Seeking",
  handover: "Handover",
};

export default async function HousingPage({
  searchParams,
}: {
  searchParams: Promise<{ trusted?: string }>;
}) {
  const { trusted } = await searchParams;
  const showTrusted = trusted === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let listings: {
    id: string;
    kind: string;
    title: string;
    neighborhood: string | null;
    price: number | null;
    photos: string[] | null;
  }[] = [];

  let widened = false;
  let trustedCount = 0;

  if (showTrusted && user) {
    const ids = await fetchTrustedItemIds(supabase, "listing", user.id);
    trustedCount = ids.length;
    if (ids.length >= NEVER_EMPTY_THRESHOLD) {
      const { data } = await supabase
        .from("housing_listings")
        .select("id, kind, title, neighborhood, price, photos")
        .in("id", ids)
        .order("created_at", { ascending: false });
      listings = data ?? [];
    } else {
      widened = true;
    }
  }

  if (!showTrusted || widened) {
    const { data } = await supabase
      .from("housing_listings")
      .select("id, kind, title, neighborhood, price, photos")
      .order("created_at", { ascending: false });
    listings = data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">Housing</h1>
        <Link
          href="/housing/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          List housing
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        Available, seeking, and handover listings — handovers bundle the knowledge that comes with the place.
      </p>

      {user && (
        <div className="mt-4">
          <TrustedToggle active={showTrusted && !widened} widened={widened} />
        </div>
      )}

      <div className="mt-6">
        {widened && <WidenedScopeBanner count={trustedCount} />}
        {listings.length === 0 ? (
          <EmptyState
            message="No listings yet. Be the first to post one."
            ctaHref="/housing/new"
            ctaLabel="List housing"
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/housing/${l.id}`}
                  className="block overflow-hidden rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]"
                >
                  {l.photos && l.photos.length > 0 && (
                    <div className="relative h-40 w-full bg-[var(--color-base)]">
                      <Image src={l.photos[0]} alt={l.title} fill className="object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">
                      {KIND_LABEL[l.kind] ?? l.kind}
                    </p>
                    <p className="mt-1 font-medium text-[var(--color-ink)]">{l.title}</p>
                    <p className="text-sm text-[var(--color-neutral)]">
                      {l.neighborhood}
                      {l.price ? ` · €${l.price}/mo` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
