import Link from "next/link";
import { LayoutGrid, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/signout-button";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-rule bg-paper">
      <div className="container-sheet flex h-16 items-center justify-between gap-1.5 sm:gap-4">
        <Link href="/" className="flex min-w-0 items-baseline gap-2">
          <span className="whitespace-nowrap font-display text-lg font-bold tracking-tight text-ink sm:text-xl">
            SmartPrep
          </span>
          <span className="hidden font-mono text-label uppercase text-mute sm:inline">
            study engine
          </span>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-1 sm:gap-3"
          aria-label="Primary"
        >
          <ThemeToggle />

          {user ? (
            <>
              <ButtonLink
                href="/dashboard"
                variant="ghost"
                aria-label="Your quizzes"
                className="hidden w-11 justify-center px-0 min-[360px]:inline-flex sm:w-auto sm:px-3"
              >
                <LayoutGrid size={18} aria-hidden className="sm:hidden" />
                <span className="hidden sm:inline">Dashboard</span>
              </ButtonLink>

              <ButtonLink href="/create" size="md" className="px-2.5 sm:px-4">
                <Sparkles size={16} aria-hidden />
                <span>Create set</span>
              </ButtonLink>

              <SignOutButton />
            </>
          ) : (
            <>
              <ButtonLink
                href="/login"
                variant="ghost"
                size="md"
                className="px-2.5 sm:px-3"
              >
                Sign in
              </ButtonLink>
              <ButtonLink href="/signup" size="md" className="px-2.5 sm:px-4">
                Get started
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
