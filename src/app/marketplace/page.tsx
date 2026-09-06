import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import { toggleSold } from "@/app/marketplace/actions";
import DemoBadge from "@/components/DemoBadge";
import KindFilterTabs from "@/components/KindFilterTabs";
import MessagePosterButton from "@/components/MessagePosterButton";
import PhotoCarousel from "@/components/PhotoCarousel";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listings } = await supabase
    .from("marketplace_listings")
    .select("id, title, price, status, photos, seller_id, profiles(name, is_demo)")
    .order("created_at", { ascending: false });

  const filtered = (listings ?? []).filter((l) => !status || status === "all" || l.status === status);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">Marketplace</h1>
        <Link
          href="/marketplace/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          List something
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">Buy and sell within the community.</p>

      <div className="mt-4">
        <KindFilterTabs options={STATUS_OPTIONS} paramName="status" />
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState message="No listings yet. Be the first to post one." ctaHref="/marketplace/new" ctaLabel="List something" />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {filtered.map((l) => {
              const isOwner = user?.id === l.seller_id;
              const photos = (l.photos as string[] | null) ?? [];
              const sellerProfile = l.profiles as unknown as { name: string; is_demo: boolean } | null;
              return (
                <li
                  key={l.id}
                  className={`overflow-hidden rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] ${l.status === "sold" ? "opacity-60" : ""}`}
                >
                  {photos.length > 0 && <PhotoCarousel photos={photos} alt={l.title} />}
                  <div className="p-4">
                    <p className="font-medium text-[var(--color-ink)]">{l.title}</p>
                    <p className="text-sm text-[var(--color-neutral)]">
                      {l.price ? `€${l.price}` : "Price on ask"} · {l.status}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-[var(--color-neutral-light)]">
                      {sellerProfile?.name}
                      {sellerProfile?.is_demo && <DemoBadge />}
                    </p>
                    {isOwner ? (
                      <form action={toggleSold} className="mt-2">
                        <input type="hidden" name="listing_id" value={l.id} />
                        <input type="hidden" name="next_status" value={l.status === "sold" ? "available" : "sold"} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-[var(--color-primary-deep)]"
                        >
                          Mark as {l.status === "sold" ? "available" : "sold"}
                        </button>
                      </form>
                    ) : (
                      user &&
                      l.status === "available" && (
                        <div className="mt-2">
                          <MessagePosterButton
                            toId={l.seller_id}
                            contextType="marketplace_listing"
                            contextId={l.id}
                            returnTo="/marketplace"
                          />
                        </div>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
