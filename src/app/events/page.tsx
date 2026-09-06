import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import { rsvpToEvent } from "@/app/events/actions";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nowIso = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from("events")
    .select("id, title, starts_at, location, cover_photo, rsvps(profile_id)")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true });

  const { data: past } = await supabase
    .from("events")
    .select("id, title, starts_at, location, cover_photo, event_photos(id, photo_url)")
    .lt("starts_at", nowIso)
    .order("starts_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">Events</h1>
        <Link
          href="/events/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Post an event
        </Link>
      </div>

      <section className="mt-6">
        {!upcoming || upcoming.length === 0 ? (
          <EmptyState message="No upcoming events yet. Be the first to post one." ctaHref="/events/new" ctaLabel="Post an event" />
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((e) => (
              <li key={e.id} className="overflow-hidden rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)]">
                {e.cover_photo && (
                  <div className="relative h-32 w-full bg-[var(--color-base)]">
                    <Image src={e.cover_photo} alt={e.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{e.title}</p>
                    <p className="text-sm text-[var(--color-neutral)]">
                      {new Date(e.starts_at).toLocaleString()}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                  {user && (
                    <form action={rsvpToEvent}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-[var(--color-neutral-border)] px-3 py-1.5 text-sm text-[var(--color-ink)] hover:border-[var(--color-primary)]"
                      >
                        RSVP ({e.rsvps.length})
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past && past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">Past events</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {past.map((e) => (
              <li key={e.id} className="overflow-hidden rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)]">
                {e.cover_photo && (
                  <div className="relative h-32 w-full bg-[var(--color-base)]">
                    <Image src={e.cover_photo} alt={e.title} fill className="object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-medium text-[var(--color-ink)]">{e.title}</p>
                  <p className="text-sm text-[var(--color-neutral)]">{new Date(e.starts_at).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
