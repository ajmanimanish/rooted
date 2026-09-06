import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchRankedHelpers } from "@/lib/arrivalHelpMatching";
import { offerHelp } from "@/app/arrival-help/actions";

const REASON_LABEL: Record<string, string> = {
  shared_group: "Shares a group with the requester",
  vouch_proximity: "Connected through the trust network",
  unconnected: "Verified, not yet connected",
};

export default async function ArrivalHelpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("arrival_help_requests")
    .select(
      "id, traveler_note, languages_needed, arrival_window, flight_info, status, requester_id, profiles(id, name, linkedin_verified, employer_verified)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!request) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requester = request.profiles as unknown as {
    id: string;
    name: string;
    linkedin_verified: boolean;
    employer_verified: boolean;
  } | null;

  const { count: requesterVouchCount } = await supabase
    .from("vouches")
    .select("id", { count: "exact", head: true })
    .eq("vouchee_id", request.requester_id);

  const { data: offers } = await supabase
    .from("arrival_help_offers")
    .select("id, confirmed, helper_id, profiles(name)")
    .eq("request_id", id);

  const alreadyOffered = Boolean(user && offers?.some((o) => o.helper_id === user.id));

  let canOffer = false;
  if (user && user.id !== request.requester_id) {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("linkedin_verified, employer_verified")
      .eq("id", user.id)
      .maybeSingle();
    const { count: myVouchCount } = await supabase
      .from("vouches")
      .select("id", { count: "exact", head: true })
      .eq("vouchee_id", user.id);
    canOffer = Boolean((myProfile?.linkedin_verified || myProfile?.employer_verified) && (myVouchCount ?? 0) >= 2);
  }

  const rankedHelpers = await fetchRankedHelpers(supabase, request.requester_id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">
        Arrival help · {request.status}
      </p>
      <h1 className="mt-1 font-serif text-2xl text-[var(--color-ink)]">{request.traveler_note}</h1>

      <div className="mt-2 flex items-center gap-2 text-sm text-[var(--color-neutral)]">
        <Link href={`/profile/${request.requester_id}`} className="font-medium text-[var(--color-primary-deep)] hover:underline">
          {requester?.name ?? "Someone"}
        </Link>
        {(requester?.linkedin_verified || requester?.employer_verified) && (
          <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary-deep)]">
            ✓ Verified
          </span>
        )}
        <span className="text-xs text-[var(--color-neutral-light)]">{requesterVouchCount ?? 0} vouches</span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-[var(--color-neutral-light)]">Arrival window</dt>
          <dd className="text-[var(--color-ink)]">{new Date(request.arrival_window).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-neutral-light)]">Languages needed</dt>
          <dd className="text-[var(--color-ink)]">{(request.languages_needed ?? []).join(", ")}</dd>
        </div>
        {request.flight_info && (
          <div>
            <dt className="text-[var(--color-neutral-light)]">Flight</dt>
            <dd className="text-[var(--color-ink)]">{request.flight_info}</dd>
          </div>
        )}
      </dl>

      {user && user.id !== request.requester_id && (
        <div className="mt-6">
          {alreadyOffered ? (
            <p className="rounded-lg border border-[var(--color-neutral-border)] px-4 py-2 text-sm text-[var(--color-neutral)]">
              You&apos;ve offered to help.
            </p>
          ) : canOffer ? (
            <form action={offerHelp}>
              <input type="hidden" name="request_id" value={request.id} />
              <button
                type="submit"
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
              >
                Offer to help
              </button>
            </form>
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--color-neutral-border)] px-4 py-3 text-sm text-[var(--color-neutral)]">
              Offering arrival help needs verified identity and at least 2 vouches from the
              community — the highest trust bar on Rooted. Use the{" "}
              <span className="font-medium text-[var(--color-ink)]">Verify me</span> button in the
              top bar and ask people you know to vouch for you.
            </p>
          )}
        </div>
      )}

      {offers && offers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Offers to help ({offers.length})
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {offers.map((o) => (
              <li key={o.id} className="rounded-full bg-[var(--color-base)] px-3 py-1 text-sm text-[var(--color-ink)]">
                {(o.profiles as unknown as { name: string } | null)?.name ?? "Someone"}
                {o.confirmed && " ✓"}
              </li>
            ))}
          </ul>
        </section>
      )}

      {rankedHelpers.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Potential helpers
          </h2>
          <p className="mt-1 text-xs text-[var(--color-neutral-light)]">
            Ranked by connection to {requester?.name?.split(" ")[0] ?? "the requester"} — shared groups and the
            trust network first.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {rankedHelpers.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5"
              >
                <Link href={`/profile/${h.id}`} className="font-medium text-[var(--color-ink)] hover:text-[var(--color-primary-deep)]">
                  {h.name}
                </Link>
                <div className="flex items-center gap-2 text-xs text-[var(--color-neutral)]">
                  <span>{h.vouchCount} vouches</span>
                  <span className="rounded-full bg-[var(--color-base)] px-2 py-0.5">{REASON_LABEL[h.reason]}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
