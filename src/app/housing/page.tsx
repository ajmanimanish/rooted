import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchTrustedItemIds, NEVER_EMPTY_THRESHOLD } from "@/lib/items";
import EmptyState from "@/components/EmptyState";
import TrustedToggle from "@/components/TrustedToggle";
import WidenedScopeBanner from "@/components/WidenedScopeBanner";
import KindFilterTabs from "@/components/KindFilterTabs";
import MessagePosterButton from "@/components/MessagePosterButton";
import PhotoCarousel from "@/components/PhotoCarousel";

const KIND_LABEL: Record<string, string> = {
  available: "Available",
  seeking: "Seeking",
  handover: "Handover",
};

const KIND_OPTIONS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "seeking", label: "Seeking" },
  { value: "handover", label: "Handovers" },
];

export default async function HousingPage({
  searchParams,
}: {
  searchParams: Promise<{ trusted?: string; kind?: string }>;
}) {
  const { trusted, kind } = await searchParams;
  const showTrusted = trusted === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVerified = false;
  if (user) {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("linkedin_verified, employer_verified")
      .eq("id", user.id)
      .maybeSingle();
    isVerified = Boolean(myProfile?.linkedin_verified || myProfile?.employer_verified);
  }

  let listings: {
    id: string;
    kind: string;
    title: string;
    neighborhood: string | null;
    price: number | null;
    photos: string[] | null;
    author_id: string;
  }[] = [];

  let widened = false;
  let trustedCount = 0;
  const selectCols = "id, kind, title, neighborhood, price, photos, author_id";

  if (showTrusted && user) {
    const ids = await fetchTrustedItemIds(supabase, "listing", user.id);
    trustedCount = ids.length;
    if (ids.length >= NEVER_EMPTY_THRESHOLD) {
      const { data } = await supabase
        .from("housing_listings")
        .select(selectCols)
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
      .select(selectCols)
      .order("created_at", { ascending: false });
    listings = data ?? [];
  }

  if (kind && kind !== "all") {
    listings = listings.filter((l) => l.kind === kind);
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <KindFilterTabs options={KIND_OPTIONS} />
        {user && <TrustedToggle active={showTrusted && !widened} widened={widened} />}
      </div>

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
            {listings.map((l) => {
              const isLockedHandover = l.kind === "handover" && !isVerified;
              return (
                <li key={l.id} className="overflow-hidden rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)]">
                  <Link href={`/housing/${l.id}`} className="block hover:opacity-95">
                    {l.photos && l.photos.length > 0 && (
                      <PhotoCarousel photos={l.photos} alt={l.title} blurred={isLockedHandover} />
                    )}
                    <div className="p-4 pb-2">
                      <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">
                        {KIND_LABEL[l.kind] ?? l.kind}
                      </p>
                      <p className="mt-1 font-medium text-[var(--color-ink)]">
                        {isLockedHandover ? "🔒 verify to view" : l.title}
                      </p>
                      <p className="text-sm text-[var(--color-neutral)]">
                        {l.neighborhood}
                        {l.price ? ` · €${l.price}/mo` : ""}
                      </p>
                    </div>
                  </Link>
                  {user && user.id !== l.author_id && !isLockedHandover && (
                    <div className="px-4 pb-4">
                      <MessagePosterButton
                        toId={l.author_id}
                        contextType="housing_listing"
                        contextId={l.id}
                        returnTo="/housing"
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
