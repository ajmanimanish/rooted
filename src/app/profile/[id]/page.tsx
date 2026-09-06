import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findVouchPath } from "@/lib/trust";
import { vouchFor } from "@/app/profile/actions";
import TrustPath from "@/components/TrustPath";
import DemoBadge from "@/components/DemoBadge";

const STAGE_LABEL: Record<string, string> = {
  just_arrived: "Just arrived",
  settling_in: "Settling in",
  long_term: "Long-term",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, city, stage, linkedin_verified, employer_verified, verified_local, is_demo, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isSelf = user?.id === profile.id;

  const { data: vouchers } = await supabase
    .from("vouches")
    .select("voucher_id, profiles!vouches_voucher_id_fkey(name)")
    .eq("vouchee_id", profile.id);

  const alreadyVouched = Boolean(
    user && vouchers?.some((v) => v.voucher_id === user.id),
  );

  const trustPath = user && !isSelf ? await findVouchPath(supabase, user.id, profile.id) : null;

  const badges = [
    profile.linkedin_verified && "LinkedIn verified",
    profile.employer_verified && "Employer verified",
    profile.verified_local && "Verified local",
  ].filter(Boolean) as string[];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl text-[var(--color-ink)]">{profile.name}</h1>
            {profile.is_demo && <DemoBadge />}
          </div>
          <p className="mt-1 text-sm text-[var(--color-neutral)]">
            {STAGE_LABEL[profile.stage] ?? profile.stage} · {profile.city}
          </p>
        </div>
        {user && !isSelf && !alreadyVouched && (
          <form action={vouchFor}>
            <input type="hidden" name="vouchee_id" value={profile.id} />
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
            >
              Vouch for {profile.name.split(" ")[0]}
            </button>
          </form>
        )}
        {alreadyVouched && (
          <p className="rounded-lg border border-[var(--color-neutral-border)] px-4 py-2 text-sm text-[var(--color-neutral)]">
            You&apos;ve vouched for {profile.name.split(" ")[0]}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {badges.length > 0 ? (
          badges.map((b) => (
            <span
              key={b}
              className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary-deep)]"
            >
              ✓ {b}
            </span>
          ))
        ) : (
          <span className="text-sm text-[var(--color-neutral-light)]">Not yet verified</span>
        )}
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
          Vouched for by ({vouchers?.length ?? 0})
        </h2>
        {vouchers && vouchers.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {vouchers.map((v) => (
              <li
                key={v.voucher_id}
                className="rounded-full bg-[var(--color-base)] px-3 py-1 text-sm text-[var(--color-ink)]"
              >
                {(v.profiles as unknown as { name: string } | null)?.name ?? "Someone"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-neutral-light)]">No vouches yet.</p>
        )}
      </section>

      {trustPath && trustPath.length > 1 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Your path to {profile.name.split(" ")[0]}
          </h2>
          <div className="mt-2">
            <TrustPath path={trustPath} />
          </div>
        </section>
      )}
    </main>
  );
}
