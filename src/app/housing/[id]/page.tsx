import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import DemoBadge from "@/components/DemoBadge";

const KIND_LABEL: Record<string, string> = {
  available: "Available",
  seeking: "Seeking",
  handover: "Handover",
};

export default async function HousingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("housing_listings")
    .select("id, kind, title, neighborhood, price, currency, description, handover_knowledge, photos, created_at, profiles(name, is_demo)")
    .eq("id", id)
    .maybeSingle();

  if (!listing) notFound();

  const authorProfile = listing.profiles as unknown as { name: string; is_demo: boolean } | null;
  const author = authorProfile?.name ?? "Someone";
  const handover = listing.handover_knowledge as Record<string, string> | null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">
        {KIND_LABEL[listing.kind] ?? listing.kind}
      </p>
      <h1 className="mt-1 font-serif text-2xl text-[var(--color-ink)]">{listing.title}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-neutral)]">
        Posted by {author}
        {authorProfile?.is_demo && <DemoBadge />}
        {listing.neighborhood ? ` · ${listing.neighborhood}` : ""}
        {listing.price ? ` · €${listing.price}/mo` : ""}
      </p>

      {listing.photos && listing.photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {listing.photos.map((url: string) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-lg bg-[var(--color-base)]">
              <Image src={url} alt={listing.title} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {listing.description && (
        <p className="mt-4 text-[var(--color-ink)]">{listing.description}</p>
      )}

      {handover && (
        <section className="mt-6 rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Handover knowledge
          </h2>
          <dl className="mt-3 grid gap-2 text-sm">
            {handover.plumber && (
              <div><dt className="inline font-medium text-[var(--color-ink)]">Plumber: </dt><dd className="inline text-[var(--color-neutral)]">{handover.plumber}</dd></div>
            )}
            {handover.tax_adviser && (
              <div><dt className="inline font-medium text-[var(--color-ink)]">Tax adviser: </dt><dd className="inline text-[var(--color-neutral)]">{handover.tax_adviser}</dd></div>
            )}
            {handover.doctor && (
              <div><dt className="inline font-medium text-[var(--color-ink)]">Doctor: </dt><dd className="inline text-[var(--color-neutral)]">{handover.doctor}</dd></div>
            )}
            {handover.tips && (
              <div><dt className="inline font-medium text-[var(--color-ink)]">Tips: </dt><dd className="inline text-[var(--color-neutral)]">{handover.tips}</dd></div>
            )}
          </dl>
        </section>
      )}
    </main>
  );
}
