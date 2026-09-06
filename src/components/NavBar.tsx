import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CreateMenu from "@/components/CreateMenu";

const SECTIONS = [
  { href: "/groups", label: "Groups" },
  { href: "/housing", label: "Housing" },
  { href: "/knowledge", label: "Knowledge" },
  { href: "/resources", label: "Resources" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/events", label: "Events" },
];

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVerified = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("linkedin_verified, employer_verified")
      .eq("id", user.id)
      .maybeSingle();
    isVerified = Boolean(profile?.linkedin_verified || profile?.employer_verified);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-neutral-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="font-serif text-lg font-semibold text-[var(--color-primary-deep)]">
          Rooted
        </Link>

        <nav className="hidden flex-1 items-center gap-5 md:flex">
          {SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="text-sm text-[var(--color-neutral)] hover:text-[var(--color-ink)]"
            >
              {s.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user && <CreateMenu />}

          {!isVerified && (
            <Link
              href="/verify"
              className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Verify me
            </Link>
          )}

          {user ? (
            <>
              <Link href="/messages" className="text-sm text-[var(--color-neutral)] hover:text-[var(--color-ink)]">
                Messages
              </Link>
              <Link href={`/profile/${user.id}`} className="text-sm text-[var(--color-neutral)] hover:text-[var(--color-ink)]">
                Profile
              </Link>
              <form action="/auth/sign-out" method="post">
                <button className="text-sm text-[var(--color-neutral)] hover:text-[var(--color-ink)]">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-[var(--color-primary-deep)]">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
